import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// npm resolves these by host platform, and a bundleDependencies tree is extracted as-is, so a
// tarball packed on one machine leaves every other platform with no binary to run.
export const PLATFORM_PACKAGES = [
  '@esbuild/darwin-arm64',
  '@esbuild/darwin-x64',
  '@esbuild/linux-arm64',
  '@esbuild/linux-x64',
  '@esbuild/win32-x64',
  '@ast-grep/napi-darwin-arm64',
  '@ast-grep/napi-darwin-x64',
  '@ast-grep/napi-linux-arm64-gnu',
  '@ast-grep/napi-linux-arm64-musl',
  '@ast-grep/napi-linux-x64-gnu',
  '@ast-grep/napi-linux-x64-musl',
  '@ast-grep/napi-win32-x64-msvc',
];

interface LockEntry {
  version: string;
  integrity: string;
}

export function bundlePlatforms(root: string): void {
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')) as {
    packages: Record<string, LockEntry | undefined>;
  };
  const staging = mkdtempSync(join(tmpdir(), 'condom-platforms-'));

  try {
    for (const name of PLATFORM_PACKAGES) {
      const pinned = lock.packages[`node_modules/${name}`];
      if (!pinned) throw new Error(`${name} is not pinned in package-lock.json`);

      const dir = join(root, 'node_modules', name);
      const manifest = join(dir, 'package.json');
      if (existsSync(manifest)) {
        const { version } = JSON.parse(readFileSync(manifest, 'utf8')) as { version: string };
        if (version === pinned.version) continue;
      }

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

      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      // GNU tar reads -C positionally and ignores it after the archive; cwd is unambiguous.
      execFileSync('tar', ['--extract', '--gzip', '--strip-components=1', '--file', tarball], { cwd: dir });
      if (!existsSync(manifest)) throw new Error(`${name} did not extract into node_modules`);

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
