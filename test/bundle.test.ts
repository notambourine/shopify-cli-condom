import { test } from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { bundlePlatforms, PLATFORM_BINARIES } from '../scripts/bundle-platforms.ts';

test('repairs incomplete platform packages and preserves the old tree when extraction is incomplete', (context) => {
  const root = mkdtempSync(join(tmpdir(), 'condom-bundle-test-'));
  const exec = childProcess.execFileSync;
  const name = '@esbuild/linux-x64';
  const binary = 'bin/esbuild';
  const installed = join(root, 'node_modules', name);
  const archiveRoot = join(root, 'archive');
  const archive = join(root, 'platform.tgz');
  const lock: { packages: Record<string, { version: string; integrity: string }> } = { packages: {} };
  let downloads = 0;
  const pack = () => {
    exec('tar', ['-czf', archive, 'package'], { cwd: archiveRoot });
    const integrity = 'sha512-' + createHash('sha512').update(readFileSync(archive)).digest('base64');
    lock.packages[`node_modules/${name}`] = { version: '1.0.0', integrity };
    writeFileSync(join(root, 'package-lock.json'), JSON.stringify(lock));
    return integrity;
  };
  try {
    for (const [platform, file] of Object.entries(PLATFORM_BINARIES)) {
      const dir = join(root, 'node_modules', platform);
      mkdirSync(dirname(join(dir, file)), { recursive: true });
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: platform, version: '1.0.0' }));
      writeFileSync(join(dir, file), 'old binary');
      lock.packages[`node_modules/${platform}`] = { version: '1.0.0', integrity: 'unused' };
    }
    mkdirSync(join(archiveRoot, 'package', 'bin'), { recursive: true });
    writeFileSync(join(archiveRoot, 'package', 'package.json'), JSON.stringify({ name, version: '1.0.0' }));
    writeFileSync(join(archiveRoot, 'package', binary), 'replacement binary');
    let integrity = pack();
    const mocked = context.mock.method(childProcess, 'execFileSync', (file: string, args: string[], options: childProcess.ExecFileSyncOptions) => {
      if (file !== 'npm') return exec(file, args, options);
      downloads += 1;
      const destination = args[args.indexOf('--pack-destination') + 1]!;
      copyFileSync(archive, join(destination, 'platform.tgz'));
      return JSON.stringify([{ filename: 'platform.tgz', integrity }]);
    });
    syncBuiltinESMExports();
    try {
      for (const damage of ['missing', 'empty', 'directory', 'manifest']) {
        rmSync(join(installed, binary), { recursive: true, force: true });
        if (damage === 'empty') writeFileSync(join(installed, binary), '');
        if (damage === 'directory') mkdirSync(join(installed, binary));
        if (damage === 'manifest') writeFileSync(join(installed, 'package.json'), '{');
        bundlePlatforms(root);
        assert.equal(readFileSync(join(installed, binary), 'utf8'), 'replacement binary');
      }
      assert.equal(downloads, 4);
      bundlePlatforms(root);
      assert.equal(downloads, 4);
      writeFileSync(join(installed, 'package.json'), JSON.stringify({ name, version: '0.9.0' }));
      rmSync(join(archiveRoot, 'package', binary));
      integrity = pack();
      assert.throws(() => bundlePlatforms(root), /missing its pinned manifest or binary/);
      assert.equal(readFileSync(join(installed, binary), 'utf8'), 'replacement binary');
      assert.equal(JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8')).version, '0.9.0');
    } finally {
      mocked.mock.restore();
      syncBuiltinESMExports();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
