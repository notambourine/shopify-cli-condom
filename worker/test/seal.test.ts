import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, importPrivateKey, importPublicKey, isSealed, normalizeStore, seal, unseal } from '../src/seal.ts';

const keys = await generateKeyPair();
const publicKey = await importPublicKey(keys.publicJwk);
const privateKey = await importPrivateKey(keys.privateJwk);
const payload = { token: 'shptka_0123456789abcdef0123456789abcdef', store: 'example.myshopify.com', exp: 4_000_000_000, label: 'tom laptop' };

test('round-trips a payload in a token the CLI treats and redacts as Theme Access', async () => {
  const sealed = await seal(publicKey, payload);
  assert.match(sealed, /^shptka_\w+$/);
  assert.ok(isSealed(sealed));
  assert.deepEqual(await unseal(privateKey, sealed), payload);
  assert.notEqual(await seal(publicKey, payload), sealed);
});

test('rejects tampering, foreign keys, and malformed tokens', async () => {
  const sealed = await seal(publicKey, payload);
  const flipped = sealed.slice(0, -1) + (sealed.endsWith('0') ? '1' : '0');
  await assert.rejects(unseal(privateKey, flipped), /does not decrypt/);
  const other = await importPrivateKey((await generateKeyPair()).privateJwk);
  await assert.rejects(unseal(other, sealed), /does not decrypt/);
  await assert.rejects(unseal(privateKey, 'shptka_0123456789abcdef'), /not sealed/);
  await assert.rejects(unseal(privateKey, 'shptka_sealed_zz'), /malformed/);
});

test('seals only Theme Access tokens bound to a myshopify.com store', async () => {
  await assert.rejects(seal(publicKey, { ...payload, token: 'shpat_abc' }), /Theme Access token/);
  await assert.rejects(seal(publicKey, { ...payload, token: 'shptka_sealed_00' }), /Theme Access token/);
  await assert.rejects(seal(publicKey, { ...payload, store: 'example' }), /myshopify\.com/);
  await assert.rejects(seal(publicKey, { ...payload, exp: 1.5 }), /exp/);
  await assert.rejects(seal(publicKey, { ...payload, label: 'x'.repeat(300) }), /exceeds/);
});

test('normalizes store handles and domains', () => {
  assert.equal(normalizeStore('Example'), 'example.myshopify.com');
  assert.equal(normalizeStore('https://example.myshopify.com/admin'), 'example.myshopify.com');
  assert.throws(() => normalizeStore('evil.example'));
});

test('never includes decrypted plaintext in malformed JSON errors', async () => {
  const plaintext = new TextEncoder().encode('{"token":"shptka_secret_do_not_echo",');
  const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, plaintext);
  const sealed = 'shptka_sealed_' + Buffer.from(encrypted).toString('hex');
  await assert.rejects(unseal(privateKey, sealed), { message: 'Sealed payload must be JSON.' });
});
