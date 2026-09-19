import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// npm resolves these by host platform, and a bundleDependencies tree is extracted as-is, so a
// tarball packed on one machine leaves every other platform with no binary to run.
export const PLATFORM_BINARIES: Record<string, string> = {
  '@esbuild/darwin-arm64': 'bin/esbuild',
  '@esbuild/darwin-x64': 'bin/esbuild',
  '@esbuild/linux-arm64': 'bin/esbuild',
  '@esbuild/linux-x64': 'bin/esbuild',
  '@esbuild/win32-x64': 'esbuild.exe',
  '@ast-grep/napi-darwin-arm64': 'ast-grep-napi.darwin-arm64.node',
  '@ast-grep/napi-darwin-x64': 'ast-grep-napi.darwin-x64.node',
  '@ast-grep/napi-linux-arm64-gnu': 'ast-grep-napi.linux-arm64-gnu.node',
  '@ast-grep/napi-linux-arm64-musl': 'ast-grep-napi.linux-arm64-musl.node',
  '@ast-grep/napi-linux-x64-gnu': 'ast-grep-napi.linux-x64-gnu.node',
  '@ast-grep/napi-linux-x64-musl': 'ast-grep-napi.linux-x64-musl.node',
  '@ast-grep/napi-win32-x64-msvc': 'ast-grep-napi.win32-x64-msvc.node',
};

interface LockEntry {
  version: string;
  integrity: string;
}

function complete(dir: string, name: string, version: string, binary: string): boolean {
  try {
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name: string; version: string };
    const file = lstatSync(join(dir, binary));
    return manifest.name === name && manifest.version === version && file.isFile() && file.size > 0;
  } catch {
    return false;
  }
}

export function bundlePlatforms(root: string): void {
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')) as {
    packages: Record<string, LockEntry | undefined>;
  };
  const staging = mkdtempSync(join(tmpdir(), 'condom-platforms-'));

  try {
    for (const [name, binary] of Object.entries(PLATFORM_BINARIES)) {
      const pinned = lock.packages[`node_modules/${name}`];
      if (!pinned) throw new Error(`${name} is not pinned in package-lock.json`);

      const dir = join(root, 'node_modules', name);
      if (complete(dir, name, pinned.version, binary)) continue;

      const output = execFileSync(
        'npm',
        [
          'pack',
          `${name}@${pinned.version}`,
          '--ignore-scripts',
          '--json',
          // Under `npm pack --dry-run` the inherited npm_config_dry_run would skip the write.
          '--no-dry-run',
          '--pack-destination',
          staging,
        ],
        { cwd: root, encoding: 'utf8' },
      );
      const [packed] = JSON.parse(output) as [{ filename: string; integrity: string }];
      if (packed.integrity !== pinned.integrity) {
        throw new Error(`${name}@${pinned.version} does not match the integrity pinned in package-lock.json`);
      }

      const tarball = join(staging, packed.filename);
      if (!existsSync(tarball)) throw new Error(`npm reported ${packed.filename} but wrote no tarball`);

      mkdirSync(dirname(dir), { recursive: true });
      const extracted = mkdtempSync(join(dirname(dir), '.condom-platform-'));
      try {
        execFileSync('tar', ['--extract', '--gzip', '--strip-components=1', '--file', tarball], { cwd: extracted });
        if (!complete(extracted, name, pinned.version, binary)) throw new Error(`${name} is missing its pinned manifest or binary`);
        rmSync(dir, { recursive: true, force: true });
        renameSync(extracted, dir);
      } finally {
        rmSync(extracted, { recursive: true, force: true });
      }

      // stdout belongs to the `npm pack --json` this runs under.
      console.error(`bundled ${name}@${pinned.version}`);
    }
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  bundlePlatforms(resolve(import.meta.dirname, '..'));
}
