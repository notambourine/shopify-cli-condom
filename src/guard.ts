import { parseArgs } from 'node:util';
import { mkdtemp, writeFile, symlink, realpath, stat, rm, access } from 'node:fs/promises';
import { join, resolve, delimiter } from 'node:path';
import { tmpdir } from 'node:os';

export type LiveReload = 'hot-reload' | 'full-page' | 'off';

export type DevOptions = {
  help?: false;
  store: string;
  path?: string;
  port?: string;
  open?: boolean;
  nodelete?: boolean;
  'live-reload'?: LiveReload;
};

export type ParsedArgs = { help: true } | DevOptions;

export type Theme = { directory: string; cleanup: () => Promise<void> };

const liveReloadModes = new Set<string>(['hot-reload', 'full-page', 'off']);

const errorCode = (error: unknown): string | undefined =>
  typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;

export const help = `Usage: shopify-cli-condom dev --store STORE [options]

Uses SHOPIFY_CLI_THEME_TOKEN for authentication.
Set SHOPIFY_CLI_CONDOM_PROXY to a proxy hostname to use a sealed token instead.
Options: --path DIR, --port PORT, --open, --nodelete,
         --live-reload hot-reload|full-page|off, --help

Only development-theme allocation is allowed. No arbitrary CLI passthrough.
This prevents accidents through this command; only the proxy restricts your token.`;

export const sealedPrefix = 'shptka_sealed_';

export function parse(argv: string[]): ParsedArgs {
  if (argv.length === 0 || (argv.length === 1 && argv[0] === '--help')) return { help: true };
  if (argv[0] !== 'dev') throw new Error('Only the dev command is allowed.');
  const { values, positionals } = parseArgs({
    args: argv.slice(1), strict: true, allowPositionals: true,
    options: {
      store: { type: 'string' }, path: { type: 'string' }, port: { type: 'string' },
      open: { type: 'boolean' }, nodelete: { type: 'boolean' },
      'live-reload': { type: 'string' }, help: { type: 'boolean' },
    },
  });
  if (positionals.length) throw new Error('Positional arguments and CLI passthrough are not allowed.');
  if (values.help) return { help: true };
  if (!values.store || !/^[a-z0-9][a-z0-9-]*(?:\.myshopify\.com)?$/.test(values.store)) {
    throw new Error('--store must be a Shopify store handle or myshopify.com domain.');
  }
  if (values.port !== undefined && (!/^\d+$/.test(values.port) || +values.port < 1 || +values.port > 65535)) {
    throw new Error('--port must be between 1 and 65535.');
  }
  if (values['live-reload'] !== undefined && !liveReloadModes.has(values['live-reload'])) {
    throw new Error('Invalid --live-reload mode.');
  }
  return values as DevOptions;
}

export function childEnvironment(
  source: Record<string, string | undefined>,
  platform: NodeJS.Platform = process.platform,
): Record<string, string | undefined> {
  const token = source.SHOPIFY_CLI_THEME_TOKEN?.trim();
  if (!token) throw new Error('Set SHOPIFY_CLI_THEME_TOKEN before starting development.');
  const proxy = source.SHOPIFY_CLI_CONDOM_PROXY?.trim();
  if (proxy !== undefined && proxy !== '' && !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(proxy)) {
    throw new Error('SHOPIFY_CLI_CONDOM_PROXY must be a hostname.');
  }
  if (proxy && !token.startsWith(sealedPrefix)) throw new Error('SHOPIFY_CLI_CONDOM_PROXY requires a sealed token (shptka_sealed_...).');
  if (!proxy && token.startsWith(sealedPrefix)) throw new Error('A sealed token requires SHOPIFY_CLI_CONDOM_PROXY.');
  const permitted = new Set([
    'PATH', 'HOME', 'USERPROFILE', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT',
    'TMPDIR', 'TMP', 'TEMP', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TERM', 'COLORTERM',
    'NO_COLOR', 'FORCE_COLOR', 'SSL_CERT_FILE', 'NODE_EXTRA_CA_CERTS',
    'SHOPIFY_CLI_THEME_TOKEN', 'SHOPIFY_CLI_NO_ANALYTICS',
  ]);
  // Windows keeps the original casing (Path, SystemRoot, ComSpec), so exact matches drop PATH.
  const normalize = platform === 'win32' ? (key: string) => key.toUpperCase() : (key: string) => key;
  const env = Object.fromEntries(Object.entries(source).filter(([key]) => permitted.has(normalize(key))));
  if (proxy) env.SHOPIFY_CLI_THEME_KIT_ACCESS_DOMAIN = proxy;
  return env;
}

export async function foreignCli(
  source: Record<string, string | undefined>,
  platform: NodeJS.Platform = process.platform,
): Promise<string | null> {
  const pathKey = Object.keys(source).find((key) => key.toUpperCase() === 'PATH');
  const names = platform === 'win32' ? ['shopify.cmd', 'shopify.exe', 'shopify'] : ['shopify'];
  for (const directory of (pathKey === undefined ? '' : source[pathKey] ?? '').split(delimiter).filter(Boolean)) {
    for (const name of names) {
      const candidate = join(directory, name);
      try {
        await access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }
  }
  return null;
}

export function cliArgs(options: DevOptions, directory: string): string[] {
  const args = ['theme', 'dev', '--store', options.store, '--path', directory];
  for (const key of ['port', 'live-reload'] as const) {
    const value = options[key];
    if (value !== undefined) args.push(`--${key}`, value);
  }
  for (const key of ['open', 'nodelete'] as const) if (options[key]) args.push(`--${key}`);
  return args;
}

export async function prepareTheme(path?: string): Promise<Theme> {
  const source = await realpath(resolve(path ?? '.'));
  for (const name of ['layout', 'templates']) {
    const info = await stat(join(source, name)).catch((error: unknown) => {
      if (errorCode(error) !== 'ENOENT') throw error;
      return undefined;
    });
    if (!info?.isDirectory()) throw new Error(`Missing theme directory: ${name}`);
  }
  const directory = await mkdtemp(join(tmpdir(), 'shopify-cli-condom-'));
  const cleanup = () => rm(directory, { recursive: true, force: true });
  try {
    // An empty local config stops Shopify's upward search before it reaches repo defaults.
    await writeFile(join(directory, 'shopify.theme.toml'), '');
    for (const name of ['assets', 'blocks', 'config', 'layout', 'listings', 'locales', 'sections', 'snippets', 'templates', '.shopifyignore']) {
      const target = join(source, name);
      let info;
      try {
        info = await stat(target);
      } catch (error) {
        if (errorCode(error) === 'ENOENT') continue;
        throw error;
      }
      await symlink(target, join(directory, name), info.isDirectory() ? 'junction' : 'file');
    }
    return { directory, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
