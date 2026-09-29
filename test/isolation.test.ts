import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { childEnvironment, prepareTheme } from '../src/guard.ts';

test('the pinned CLI cannot reuse the user theme cache or load user plugins', async () => {
  const root = await mkdtemp(join(tmpdir(), 'condom-isolation-'));
  const cli = dirname(createRequire(import.meta.url).resolve('@shopify/cli/package.json'));
  const dist = join(cli, 'dist');
  const files = await readdir(dist);
  // Chunk hashes change on every CLI release; the minified export aliases are still pinned.
  const moduleUrl = async (...markers: string[]) => {
    for (const name of files.filter((file) => file.endsWith('.js'))) {
      const code = await readFile(join(dist, name), 'utf8');
      if (markers.every((marker) => code.includes(marker))) return JSON.stringify(pathToFileURL(join(dist, name)).href);
    }
    throw new Error(`No @shopify/cli module contains ${markers.join(', ')}`);
  };
  const script = `
    import {ShopifyConfig} from ${await moduleUrl('as ShopifyConfig}')};
    import {g as getTheme, h as setTheme, r as setStore} from ${await moduleUrl('Setting development theme', 'A store is required')};
    import {mkdirSync, writeFileSync} from 'node:fs';
    import {join} from 'node:path';
    const config = new ShopifyConfig({root: ${JSON.stringify(cli)}});
    await config.load();
    setStore({store: 'example.myshopify.com'});
    if (process.argv[1] === 'seed') {
      setTheme('999');
      mkdirSync(config.dataDir, {recursive: true});
      writeFileSync(join(config.dataDir, 'package.json'), JSON.stringify({oclif: {plugins: [
        {name: 'audit-plugin', type: 'link', root: process.argv[2]}
      ]}}));
    }
    console.log(JSON.stringify({theme: getTheme() ?? null, plugins: [...config.plugins.keys()]}));
  `;
  const run = async (env: Record<string, string | undefined>, args: string[] = []) => {
    const { stdout } = await promisify(execFile)(process.execPath, ['--input-type=module', '-e', script, ...args], { env });
    return JSON.parse(stdout) as { theme: string | null; plugins: string[] };
  };
  try {
    const userHome = join(root, 'user');
    const plugin = join(root, 'plugin');
    await mkdir(plugin);
    await writeFile(join(plugin, 'package.json'), JSON.stringify({ name: 'audit-plugin', version: '1.0.0', oclif: { hooks: { prerun: './hook.cjs' } } }));
    await writeFile(join(plugin, 'hook.cjs'), 'module.exports = async function () {};');
    const source = { ...process.env, SHOPIFY_CLI_THEME_TOKEN: 'shptka_fixture', HOME: userHome };
    const userEnv = childEnvironment(source, userHome);
    await run(userEnv, ['seed', plugin]);
    assert.deepEqual(await run(userEnv), { theme: '999', plugins: ['@shopify/cli', 'audit-plugin'] });
    for (const name of ['layout', 'templates']) await mkdir(join(root, name));
    const theme = await prepareTheme(root);
    try {
      assert.deepEqual(await run(childEnvironment(userEnv, theme.home)), { theme: null, plugins: ['@shopify/cli'] });
    } finally {
      await theme.cleanup();
    }
    assert.equal((await run(userEnv)).theme, '999');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
