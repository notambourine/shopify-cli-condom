import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { PLATFORM_BINARIES } from '../scripts/bundle-platforms.ts';

const pkg = resolve(import.meta.dirname, '..');

test('the tarball includes every supported platform and installs only the wrapper command', { timeout: 300_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'condom-install-'));
  const env = { ...process.env, npm_config_cache: join(root, 'cache') };
  const run = (file: string, args: string[], options: { cwd: string }) =>
    promisify(execFile)(file, args, { env, maxBuffer: 64 * 1024 * 1024, ...options });
  try {
    const { stdout } = await run('npm', ['pack', '--json', '--pack-destination', root], { cwd: pkg });
    const packed = JSON.parse(stdout) as [{ filename: string; files: { path: string; size: number }[] }];
    for (const [name, binary] of Object.entries(PLATFORM_BINARIES)) {
      assert.ok(
        packed[0].files.some((file) => file.path === `node_modules/${name}/${binary}` && file.size > 0),
        `${name}/${binary} is missing or empty in the tarball`,
      );
    }
    const tarball = join(root, packed[0].filename);
    const consumer = join(root, 'consumer');
    await mkdir(consumer);
    await run('npm', ['init', '-y'], { cwd: consumer });
    await run('npm', ['install', '--offline', '--no-audit', '--no-fund', tarball], { cwd: consumer });
    const bins = await readdir(join(consumer, 'node_modules', '.bin'));
    assert.ok(bins.includes('shopify-cli-condom'));
    assert.ok(!bins.some((name) => name.startsWith('shopify.') || name === 'shopify'));
    const help = await run('npx', ['--no-install', 'shopify-cli-condom', '--help'], { cwd: consumer });
    assert.match(help.stdout, /^Usage: shopify-cli-condom dev/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
