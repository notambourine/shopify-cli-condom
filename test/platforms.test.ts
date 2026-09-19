import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { PLATFORM_PACKAGES } from '../scripts/bundle-platforms.ts';

const pkg = resolve(import.meta.dirname, '..');

test('the tarball carries a binary for every supported platform', { timeout: 300_000 }, async () => {
  const { stdout } = await promisify(execFile)('npm', ['pack', '--dry-run', '--json'], {
    cwd: pkg,
    maxBuffer: 64 * 1024 * 1024,
  });
  const [packed] = JSON.parse(stdout) as [{ files: { path: string }[] }];
  const paths = packed.files.map((file) => file.path);

  for (const name of PLATFORM_PACKAGES) {
    assert.ok(
      paths.some((path) => path.startsWith(`node_modules/${name}/`)),
      `${name} is missing from the tarball`,
    );
  }
});
