import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after } from 'node:test';
import { sealingNamespace } from '../src/ssh.ts';

export function signingKey(type = 'ecdsa', bits = '256') {
  const directory = mkdtempSync(join(tmpdir(), 'condom-ssh-test-'));
  after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, 'key');
  execFileSync('ssh-keygen', ['-q', '-t', type, '-b', bits, '-N', '', '-f', path], { stdio: 'pipe' });
  const publicKey = readFileSync(`${path}.pub`, 'utf8').trim();
  const sign = (body: string, namespace = sealingNamespace, hash = 'sha512') => execFileSync('ssh-keygen', [
    '-Y', 'sign', '-n', namespace, '-O', `hashalg=${hash}`, '-f', path,
  ], { input: body, encoding: 'utf8', stdio: 'pipe' });
  const verify = (body: string, signature: string) => {
    writeFileSync(join(directory, 'allowed'), `fixture ${publicKey}\n`);
    writeFileSync(join(directory, 'signature'), signature);
    execFileSync('ssh-keygen', ['-Y', 'verify', '-f', join(directory, 'allowed'), '-I', 'fixture', '-n', sealingNamespace, '-s', join(directory, 'signature')], { input: body, stdio: 'pipe' });
  };
  return { publicKey, sign, verify, path };
}
