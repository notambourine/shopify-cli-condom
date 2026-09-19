import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/handler.ts';
import { issue } from '../src/admin.ts';
import { generateKeyPair, importPrivateKey, unseal } from '../src/seal.ts';
import type { Env } from '../src/handler.ts';
import { signingKey } from './ssh-fixtures.ts';

const admin = signingKey();
const other = signingKey();
const keys = await generateKeyPair();
const env: Env = { PRIVATE_KEY_JWK: JSON.stringify(keys.privateJwk), CANONICAL_HOST: 'proxy.example', ADMIN_SSH_PUBLIC_KEY: admin.publicKey };
const seconds = 2_000_000_000;
const payload = { token: 'shptka_fixture', store: 'example.myshopify.com', exp: seconds + 86400, label: 'employee' };
const claims = { aud: 'https://proxy.example', exp: seconds + 60, payload };
const upstream = async () => { throw new Error('Sealing must not contact an upstream.'); };

function request(value: unknown = claims, key = admin) {
  const body = typeof value === 'string' ? value : JSON.stringify(value);
  return new Request('https://proxy.example/seal', { method: 'POST', body, headers: { 'X-Condom-Signature': btoa(key.sign(body)) } });
}

const issueAt = (req: Request, environment = env) => issue(req, environment, seconds * 1000);

test('issues a compatible bearer credential and tolerates identical retries', async () => {
  const original = request();
  for (const req of [original.clone(), original]) {
    const response = await issueAt(req);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const json = await response.json() as { token: string; store: string; exp: number };
    assert.match(json.token, /^shptka_sealed_[0-9a-f]+$/);
    assert.deepEqual(await unseal(await importPrivateKey(keys.privateJwk), json.token), payload);
    const cli = new Request('https://proxy.example/cli/admin/api/unstable/graphql.json', {
      method: 'POST', body: JSON.stringify({ query: 'query { onlineStore { passwordProtection { enabled } } }' }),
      headers: { 'X-Shopify-Shop': payload.store, 'X-Shopify-Access-Token': json.token },
    });
    const result = await handle(cli, { ...env, ADMIN_SSH_PUBLIC_KEY: other.publicKey }, async (forwarded) => {
      assert.equal(forwarded.headers.get('X-Shopify-Access-Token'), payload.token);
      return Response.json({ data: { ok: true } });
    });
    assert.equal(result.status, 200);
  }
});

test('rejects expired, distant, foreign-service, malformed, and unsafe payloads', async () => {
  for (const value of [
    { ...claims, exp: seconds }, { ...claims, exp: seconds + 61 }, { ...claims, exp: seconds + 0.5 },
    { ...claims, aud: 'https://other.example' }, { ...claims, exp: null }, {}, null, [],
    { ...claims, payload: { ...payload, token: 'shpat_fixture' } },
    { ...claims, payload: { ...payload, store: 'other.example' } },
    { ...claims, payload: { ...payload, exp: seconds } },
    { ...claims, payload: { ...payload, exp: Number.MAX_SAFE_INTEGER + 1 } },
    { ...claims, payload: { ...payload, label: 'x'.repeat(400) } },
    '{"token":"shptka_should_not_leak",',
  ]) {
    const response = await issueAt(request(value));
    assert.ok(response.status === 400 || response.status === 401);
    assert.equal((await response.text()).includes('shptka_'), false);
  }
});

test('rejects unknown, missing, malformed, or body-swapped signatures', async () => {
  assert.equal((await issueAt(request(claims, other))).status, 401);
  const signed = request();
  const swapped = new Request(signed.url, { method: 'POST', headers: signed.headers, body: JSON.stringify({ ...claims, payload: { ...payload, store: 'swapped.myshopify.com' } }) });
  assert.equal((await issueAt(swapped)).status, 401);
  for (const signature of ['', 'not base64', 'x'.repeat(4097)]) {
    const req = request();
    req.headers.set('X-Condom-Signature', signature);
    assert.ok((await issueAt(req)).status >= 400);
  }
  const req = request();
  req.headers.set('X-Condom-Signature', btoa(admin.sign(JSON.stringify(claims), 'shopify-cli-condom:POST:/rotate')));
  assert.equal((await issueAt(req)).status, 401);
});

test('caps both declared and streamed bodies, including missing or dishonest lengths', async () => {
  for (const length of [undefined, '1', '2049']) {
    const req = new Request('https://proxy.example/seal', { method: 'POST', body: 'x'.repeat(2049), headers: { 'X-Condom-Signature': btoa(admin.sign('small')) } });
    if (length) req.headers.set('content-length', length);
    assert.equal((await issueAt(req)).status, 413);
  }
});

test('pins the host for every route and leaves admin sealing optional for self-hosters', async () => {
  for (const path of ['/seal', '/cli/sfr', '/cli/admin/api/unstable/graphql.json']) {
    assert.equal((await handle(new Request(`https://preview.example${path}`), env, upstream)).status, 421);
    assert.equal((await handle(new Request(`http://proxy.example${path}`), env, upstream)).status, 421);
  }
  assert.equal((await handle(new Request('https://proxy.example/seal'), env, upstream)).status, 405);
  assert.equal((await handle(new Request('https://proxy.example/seal?token=secret'), env, upstream)).status, 400);
  assert.equal((await issueAt(request(), { ...env, ADMIN_SSH_PUBLIC_KEY: undefined })).status, 503);
  assert.equal((await issueAt(request(), { ...env, ADMIN_SSH_PUBLIC_KEY: other.publicKey })).status, 401);
  assert.equal((await issueAt(request(claims, other), { ...env, ADMIN_SSH_PUBLIC_KEY: other.publicKey })).status, 200);
  assert.equal((await issueAt(request(), { ...env, PRIVATE_KEY_JWK: 'private-secret-invalid-json' })).status, 503);
  const error = await issueAt(request(), { ...env, PRIVATE_KEY_JWK: 'private-secret-invalid-json' });
  assert.equal((await error.text()).includes('private-secret'), false);
  assert.equal((await handle(request({ ...claims, exp: Math.floor(Date.now() / 1000) + 60 }), env, upstream)).status, 200);
});

test('refuses a server key with the wrong modulus size', async () => {
  const wrong = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
  const privateJwk = await crypto.subtle.exportKey('jwk', wrong.privateKey);
  assert.equal((await issueAt(request(), { ...env, PRIVATE_KEY_JWK: JSON.stringify(privateJwk) })).status, 503);
});
