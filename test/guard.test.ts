import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, lstat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse, childEnvironment as environment, cliArgs, prepareTheme, foreignCli } from '../src/guard.ts';
import type { Theme } from '../src/guard.ts';

const isolatedHome = join(tmpdir(), 'isolated-cli');
const state = {
  HOME: isolatedHome, USERPROFILE: isolatedHome,
  APPDATA: join(isolatedHome, 'config'), LOCALAPPDATA: join(isolatedHome, 'data'),
  XDG_CONFIG_HOME: join(isolatedHome, 'config'), XDG_DATA_HOME: join(isolatedHome, 'data'),
  XDG_CACHE_HOME: join(isolatedHome, 'cache'), XDG_STATE_HOME: join(isolatedHome, 'state'),
};
const childEnvironment = (source: Record<string, string | undefined>, platform?: NodeJS.Platform) => environment(source, isolatedHome, platform);

function parseCommand(argv: string[]) {
  const options = parse(argv);
  assert.ok(!options.help);
  return options;
}

test('rejects production targeting, aliases, commands, and passthrough', () => {
  for (const args of [
    ['push'], ['theme', 'dev'], ['dev', '--allow-live'], ['dev', '-a'],
    ['dev', '--theme=123'], ['dev', '-t123'], ['dev', '--environment', 'production'],
    ['dev', '-eproduction'], ['dev', '--live'], ['dev', '--password', 'secret'],
    ['dev', '--', '--allow-live'], ['dev', '--unknown'],
  ]) assert.throws(() => parse(args));
});

test('pulls from exactly one explicit theme and nothing that writes remotely', () => {
  for (const args of [
    [], ['--live', '--theme', '123'], ['--theme', 'Live theme'], ['--theme', '-1'], ['--development'],
    ['--live', '--environment', 'production'], ['--live', '--password', 'secret'], ['--live', '--only', '*'],
    ['--live', '--port', '9292'], ['--live', '--force'], ['--live', '--', '--theme', '1'], ['--live', 'extra'],
  ]) assert.throws(() => parse(['pull', '--store', 'store', ...args]), `pull ${args.join(' ')}`);
  assert.throws(() => parse(['pull', '--live']), /--store/);
  assert.deepEqual(cliArgs(parseCommand(['pull', '--store', 'store', '--live']), '/theme'),
    ['theme', 'pull', '--store', 'store', '--path', '/theme', '--force', '--live']);
  assert.deepEqual(cliArgs(parseCommand(['pull', '--store', 'store', '--theme=123', '--nodelete']), '/theme'),
    ['theme', 'pull', '--store', 'store', '--path', '/theme', '--force', '--theme', '123', '--nodelete']);
});

test('requires an explicit store and validates development options', () => {
  for (const args of [[], ['--store', 'evil.example'], ['--store', 'store', '--port', '0'],
    ['--store', 'store', '--live-reload', 'unknown']]) {
    assert.throws(() => parse(['dev', ...args]));
  }
  assert.deepEqual(cliArgs(parseCommand(['dev', '--store', 'example.myshopify.com', '--port=9293', '--open']), '/theme'),
    ['theme', 'dev', '--store', 'example.myshopify.com', '--path', '/theme', '--port', '9293', '--open']);
});

test('does not inherit targeting, node injection, or other Shopify configuration', () => {
  const env = childEnvironment({
    HOME: '/home/test', SHOPIFY_CLI_THEME_TOKEN: 'test-token',
    SHOPIFY_FLAG_ALLOW_LIVE: '1', SHOPIFY_FLAG_THEME_ID: '123', SHOPIFY_FLAG_ENVIRONMENT: 'production',
    SHOPIFY_FLAG_STORE: 'production', SHOPIFY_CLI_PLUGINS: '/plugin', NODE_OPTIONS: '--import=/injection.js',
  });
  assert.deepEqual(env, { ...state, SHOPIFY_CLI_THEME_TOKEN: 'test-token' });
  assert.throws(() => childEnvironment({}), /SHOPIFY_CLI_THEME_TOKEN/);
  assert.deepEqual(childEnvironment({ Path: 'C:\\bin', SystemRoot: 'C:\\Windows', SHOPIFY_CLI_THEME_TOKEN: 't' }, 'win32'),
    { ...state, Path: 'C:\\bin', SystemRoot: 'C:\\Windows', SHOPIFY_CLI_THEME_TOKEN: 't' });
  assert.deepEqual(childEnvironment({ path: '/bin', SHOPIFY_CLI_THEME_TOKEN: 't' }, 'linux'), { ...state, SHOPIFY_CLI_THEME_TOKEN: 't' });
  assert.deepEqual(childEnvironment({ home: 'unsafe', UserProfile: 'unsafe', AppData: 'unsafe', LocalAppData: 'unsafe', XDG_CONFIG_HOME: 'unsafe', SHOPIFY_CLI_THEME_TOKEN: 't' }, 'win32'), { ...state, SHOPIFY_CLI_THEME_TOKEN: 't' });
});

test('routes sealed tokens through the proxy and nowhere else', () => {
  const sealed = 'shptka_sealed_00ff';
  assert.deepEqual(childEnvironment({ SHOPIFY_CLI_THEME_TOKEN: sealed, SHOPIFY_CLI_CONDOM_PROXY: 'condom.example.workers.dev' }),
    { ...state, SHOPIFY_CLI_THEME_TOKEN: sealed, SHOPIFY_CLI_THEME_KIT_ACCESS_DOMAIN: 'condom.example.workers.dev' });
  assert.throws(() => childEnvironment({ SHOPIFY_CLI_THEME_TOKEN: sealed }), /requires SHOPIFY_CLI_CONDOM_PROXY/);
  assert.throws(() => childEnvironment({ SHOPIFY_CLI_THEME_TOKEN: 'shptka_raw', SHOPIFY_CLI_CONDOM_PROXY: 'condom.example.workers.dev' }), /sealed token/);
  for (const proxy of ['https://condom.example', 'condom.example/path', 'localhost', 'evil.example:443']) {
    assert.throws(() => childEnvironment({ SHOPIFY_CLI_THEME_TOKEN: sealed, SHOPIFY_CLI_CONDOM_PROXY: proxy }), /hostname/);
  }
  assert.deepEqual(childEnvironment({ SHOPIFY_CLI_THEME_TOKEN: 't', SHOPIFY_CLI_THEME_KIT_ACCESS_DOMAIN: 'attacker.example' }),
    { ...state, SHOPIFY_CLI_THEME_TOKEN: 't' });
});

test('detects a Shopify CLI reachable through PATH', async () => {
  const root = await mkdtemp(join(tmpdir(), 'condom-path-'));
  try {
    assert.equal(await foreignCli({ PATH: root }, 'linux'), null);
    await writeFile(join(root, 'shopify'), '');
    assert.equal(await foreignCli({ PATH: `/nonexistent:${root}` }, 'linux'), join(root, 'shopify'));
    assert.equal(await foreignCli({ Path: root }, 'win32'), join(root, 'shopify'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('names the missing theme directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'condom-empty-'));
  try {
    await mkdir(join(root, 'layout'));
    await assert.rejects(prepareTheme(root), /Missing theme directory: templates/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('pull creates missing theme directories in the source so writes survive cleanup', async () => {
  const root = await mkdtemp(join(tmpdir(), 'condom-pull-'));
  const target = join(root, 'new-theme');
  let theme: Theme | undefined;
  try {
    theme = await prepareTheme(target, 'pull');
    assert.equal((await lstat(join(theme.directory, 'sections'))).isSymbolicLink(), true);
    await writeFile(join(theme.directory, 'sections', 'header.liquid'), 'pulled');
    await theme.cleanup();
    assert.equal(await readFile(join(target, 'sections', 'header.liquid'), 'utf8'), 'pulled');
    assert.equal((await lstat(join(target, 'blocks'))).isDirectory(), true);
  } finally {
    await theme?.cleanup();
    await rm(root, { recursive: true, force: true });
  }
});

test('isolates production TOML while preserving edits and source files on cleanup', async () => {
  const root = await mkdtemp(join(tmpdir(), 'condom-test-'));
  let theme: Theme | undefined;
  try {
    for (const name of ['layout', 'templates', 'assets']) await mkdir(join(root, name));
    await writeFile(join(root, 'shopify.theme.toml'), '[environments.default]\ntheme="123"\nallow-live=true\n');
    await writeFile(join(root, '.shopifyignore'), 'assets/private.css\n');
    await writeFile(join(root, 'assets', 'app.css'), 'before');
    theme = await prepareTheme(root);
    assert.equal(await readFile(join(theme.directory, 'shopify.theme.toml'), 'utf8'), '');
    assert.equal(await readFile(join(theme.directory, '.shopifyignore'), 'utf8'), 'assets/private.css\n');
    assert.equal((await lstat(join(theme.directory, 'assets'))).isSymbolicLink(), true);
    await writeFile(join(root, 'assets', 'app.css'), 'after');
    assert.equal(await readFile(join(theme.directory, 'assets', 'app.css'), 'utf8'), 'after');
    await theme.cleanup();
    assert.equal(await readFile(join(root, 'assets', 'app.css'), 'utf8'), 'after');
    assert.match(await readFile(join(root, 'shopify.theme.toml'), 'utf8'), /allow-live=true/);
  } finally {
    await theme?.cleanup();
    await rm(root, { recursive: true, force: true });
  }
});
