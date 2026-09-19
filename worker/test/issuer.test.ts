import { test } from 'node:test';
import assert from 'node:assert/strict';
import { command, issueCredential } from '../bin/issue-command.ts';
import { handle } from '../src/handler.ts';
import { generateKeyPair, importPrivateKey, unseal } from '../src/seal.ts';
import { signingKey } from './ssh-fixtures.ts';

const admin = signingKey();
const keys = await generateKeyPair();
const secret = 'shptka_password_manager_fixture';
const options = { secret: 'op://vault/item/token', key: admin.path, store: 'example', label: 'employee', proxy: 'proxy.example', days: 30 };
const env = { PRIVATE_KEY_JWK: JSON.stringify(keys.privateJwk), CANONICAL_HOST: options.proxy, ADMIN_SSH_PUBLIC_KEY: admin.publicKey };
const calls: { file: string; args: string[]; input?: string }[] = [];
const run = async (file: string, args: string[], input?: string) => {
  calls.push({ file, args, input });
  if (file === 'gtimeout') {
    assert.deepEqual(args, ['15', 'op', 'read', options.secret]);
    assert.equal(input, undefined);
    return `${secret}\n`;
  }
  return command(file, args, input);
};

const local: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  assert.equal(request.url, 'https://proxy.example/seal');
  assert.equal(request.redirect, 'error');
  assert.equal(JSON.stringify(Object.fromEntries(request.headers)).includes(secret), false);
  return handle(request, env, async () => { throw new Error('Unexpected upstream'); });
};

test('converts a 1Password secret through OpenSSH signing and the real handler', async () => {
  const issued = await issueCredential(options, local, run);
  assert.equal(calls.length, 2);
  assert.equal(JSON.stringify(calls.map(({ args }) => args)).includes(secret), false);
  assert.equal(calls[1]?.file, 'ssh-keygen');
  const plaintext = await unseal(await importPrivateKey(keys.privateJwk), issued.token);
  assert.equal(plaintext.token, secret);
  assert.equal(plaintext.store, 'example.myshopify.com');
  assert.equal(plaintext.label, options.label);
  assert.equal(plaintext.exp, issued.exp);
  assert.equal(JSON.stringify(issued).includes(secret), false);
});

test('rejects invalid settings before reading a credential', async () => {
  for (const change of [
    { proxy: 'https://proxy.example' }, { proxy: 'proxy.example/other' }, { proxy: 'user@proxy.example' },
    { proxy: 'proxy.example:123' }, { days: 0 }, { days: 366 }, { days: 1.5 },
    { secret: 'raw-token' }, { secret: 'op://vault/item/token\n' }, { store: 'other.example' }, { label: '' }, { key: '' },
  ]) {
    await assert.rejects(issueCredential({ ...options, ...change }, local, async () => { assert.fail('Read a credential before validating settings'); }));
  }
});

test('does not echo raw credentials from command failures', async () => {
  await assert.rejects(command(process.execPath, ['-e', `process.stderr.write(${JSON.stringify(secret)}); process.exit(1)`]), (error: Error) => {
    assert.equal(error.message.includes(secret), false);
    assert.equal(error.stack?.includes(secret), false);
    return true;
  });
});

test('does not expose reflected secrets in error or malformed success responses', async () => {
  const fake = async (file: string) => file === 'gtimeout' ? secret : 'signature';
  for (const status of [400, 401, 429, 500, 503]) {
    await assert.rejects(issueCredential(options, async () => new Response(secret, { status }), fake), (error: Error) => {
      assert.equal(error.message.includes(secret), false);
      return true;
    });
  }
  for (const body of [secret, JSON.stringify({ token: secret }), 'x'.repeat(2049)]) {
    await assert.rejects(issueCredential(options, async () => new Response(body), fake), /invalid sealed credential/);
  }
  await assert.rejects(issueCredential(options, async () => { throw new Error(secret); }, fake), /No redirect was followed/);
});

test('does not contact the endpoint when reading or signing fails', async () => {
  for (const failure of ['gtimeout', 'ssh-keygen']) {
    await assert.rejects(issueCredential(options, async () => { assert.fail('Sent an unsigned request'); }, async (file) => {
      if (file === failure) throw new Error('Unavailable');
      return secret;
    }), /Unavailable/);
  }
});
