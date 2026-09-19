#!/usr/bin/env node
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { parse, help, childEnvironment, cliArgs, prepareTheme, foreignCli } from '../src/guard.ts';

try {
  const options = parse(process.argv.slice(2));
  if (options.help) {
    console.log(help);
  } else {
    const foreign = await foreignCli(process.env);
    if (foreign) console.error(`shopify-cli-condom: warning: ${foreign} bypasses this wrapper; uninstall it on development machines.`);
    const require = createRequire(import.meta.url);
    const manifestPath = require.resolve('@shopify/cli/package.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as { bin: { shopify: string } };
    const entry = resolve(dirname(manifestPath), manifest.bin.shopify);
    const theme = await prepareTheme(options.path);
    const handlers = new Map<NodeJS.Signals, () => void>();
    try {
      const env = childEnvironment(process.env, theme.home);
      const child = spawn(process.execPath, [entry, ...cliArgs(options, theme.directory)], {
        cwd: theme.directory, env, stdio: 'inherit', shell: false,
      });
      // A terminal delivers SIGINT to the whole foreground group, so forwarding it would interrupt the CLI's shutdown twice.
      for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
        const handler = () => { if (signal !== 'SIGINT' || !process.stdin.isTTY) child.kill(signal); };
        handlers.set(signal, handler);
        process.on(signal, handler);
      }
      const signalExits: Partial<Record<NodeJS.Signals, number>> = { SIGINT: 130, SIGTERM: 143, SIGHUP: 129 };
      process.exitCode = await new Promise<number>((accept, reject) => {
        child.once('error', reject);
        child.once('exit', (code, signal) => accept(code ?? (signal === null ? 1 : signalExits[signal] ?? 1)));
      });
    } finally {
      for (const [signal, handler] of handlers) process.off(signal, handler);
      await theme.cleanup();
    }
  }
} catch (error) {
  console.error(`shopify-cli-condom: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
