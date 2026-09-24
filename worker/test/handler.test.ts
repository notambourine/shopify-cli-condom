import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/handler.ts';
import type { Env } from '../src/handler.ts';
import { generateKeyPair, importPublicKey, seal } from '../src/seal.ts';
import { openPreview, sealPreview } from '../src/preview-session.ts';

const keys = await generateKeyPair();
const publicKey = await importPublicKey(keys.publicJwk);
const store = 'example.myshopify.com';
const realToken = 'shptka_0123456789abcdef0123456789abcdef';
const devGid = 'gid://shopify/OnlineStoreTheme/111';
const liveGid = 'gid://shopify/OnlineStoreTheme/999';
const sealed = await seal(publicKey, { token: realToken, store, exp: 4_000_000_000 });

type Seen = { url: string; method: string; headers: Record<string, string>; body: string };

function upstream(reply: (seen: Seen) => Response | Promise<Response>) {
  const seen: Seen[] = [];
  const fetcher = async (request: Request) => {
    const entry = { url: request.url, method: request.method, headers: Object.fromEntries(request.headers), body: await request.text() };
    seen.push(entry);
    return reply(entry);
  };
  return { seen, fetcher };
}

const json = (value: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' }, ...init });
const roleReply = (seen: Seen) => json({ data: { theme: { role: seen.body.includes('/111') ? 'DEVELOPMENT' : 'MAIN' } } });

function env(): Env {
  return { PRIVATE_KEY_JWK: JSON.stringify(keys.privateJwk), CANONICAL_HOST: 'proxy.example' };
}

function admin(body: unknown, token = sealed, shop = store) {
  return new Request('https://proxy.example/cli/admin/api/2026-07/graphql.json', {
    method: 'POST', body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'user-agent': 'Shopify CLI; v=4.7.1', 'X-Shopify-Shop': shop, 'X-Shopify-Access-Token': token, cookie: 'secret=1' },
  });
}

const upsert = (themeId: string) => ({
  query: 'mutation themeFilesUpsert($files: [OnlineStoreThemeFilesUpsertFileInput!]!, $themeId: ID!) { themeFilesUpsert(files: $files, themeId: $themeId) { upsertedThemeFiles { filename } } }',
  variables: { files: [{ filename: 'layout/theme.liquid', body: { type: 'TEXT', value: '' } }], themeId },
});

async function message(response: Response) {
  return ((await response.json()) as { errors: { message: string }[] }).errors[0]?.message ?? '';
}

test('rejects unsealed, foreign, expired, and store-mismatched credentials before touching Shopify', async () => {
  const { seen, fetcher } = upstream(() => json({}));
  const cases: [Request, RegExp][] = [
    [admin(upsert(devGid), realToken), /not sealed/],
    [admin(upsert(devGid), await seal(await importPublicKey((await generateKeyPair()).publicJwk), { token: realToken, store, exp: 4_000_000_000 })), /does not decrypt/],
    [admin(upsert(devGid), await seal(publicKey, { token: realToken, store, exp: 1 })), /expired/],
    [admin(upsert(devGid), sealed, 'other.myshopify.com'), /another store/],
    [admin(upsert(devGid), sealed, 'evil.example'), /not a Shopify store/],
    [new Request('https://proxy.example/cli/admin/api/2026-07/graphql.json', { method: 'POST', body: '{}' }), /Missing/],
  ];
  for (const [request, reason] of cases) {
    const response = await handle(request, env(), fetcher);
    assert.equal(response.status, 401);
    assert.match(await message(response), reason);
  }
  assert.equal(seen.length, 0);
});

test('forwards development-theme writes with the real token and an allowlisted header set', async () => {
  const { seen, fetcher } = upstream((entry) => (entry.body.includes('role }') ? roleReply(entry) : json({ data: { ok: true } })));
  const response = await handle(admin(upsert(devGid)), env(), fetcher);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { ok: true } });
  assert.equal(seen.length, 2);
  const forwarded = seen[1]!;
  assert.equal(forwarded.url, 'https://theme-kit-access.shopifyapps.com/cli/admin/api/2026-07/graphql.json');
  assert.equal(forwarded.headers['x-shopify-access-token'], realToken);
  assert.equal(forwarded.headers['x-shopify-shop'], store);
  assert.equal(forwarded.headers['user-agent'], 'Shopify CLI; v=4.7.1');
  assert.equal(forwarded.headers.cookie, undefined);
  assert.deepEqual(JSON.parse(forwarded.body), upsert(devGid));
  await handle(admin(upsert(devGid)), env(), fetcher);
  assert.equal(seen.length, 4);
});

test('refuses writes to a theme Shopify reports as anything but development', async () => {
  const { seen, fetcher } = upstream(roleReply);
  const response = await handle(admin(upsert(liveGid)), env(), fetcher);
  assert.equal(response.status, 403);
  assert.match(await message(response), /999 is not a development theme/);
  assert.equal(seen.length, 1);
  const publish = await handle(admin({ query: `mutation { themePublish(id: "${devGid}") { theme { id } } }` }), env(), fetcher);
  assert.equal(publish.status, 403);
  assert.equal(seen.length, 1);
});

test('looks up even newly created themes before accepting writes', async () => {
  const { seen, fetcher } = upstream((entry) => entry.body.includes('role }') ? json({ data: { theme: { role: 'DEVELOPMENT' } } }) : json({ data: { ok: true } }));
  const response = await handle(admin({ query: 'mutation { themeCreate(name: "Dev", role: DEVELOPMENT) { theme { id } } }' }), env(), fetcher);
  assert.equal(response.status, 200);
  assert.equal((await handle(admin(upsert('gid://shopify/OnlineStoreTheme/555')), env(), fetcher)).status, 200);
  assert.equal(seen.length, 3);
  assert.match(seen[1]?.body ?? '', /theme\(id:/);
});

test('proxies storefront rendering only for development preview themes', async () => {
  const { seen, fetcher } = upstream((entry) => (entry.url.includes('/cli/admin/') ? roleReply(entry) : new Response('<html>', { status: 302, headers: { location: '/password' } })));
  const cookie = await sealPreview({ store, token: realToken }, { id: '111', cookie: 'abc' });
  const headers = { 'X-Shopify-Shop': store, 'X-Shopify-Access-Token': sealed, cookie: `_shopify_essential=${cookie}`, authorization: 'Bearer sf', 'cf-connecting-ip': '1.1.1.1', host: 'proxy.example' };
  const denied = await handle(new Request('https://proxy.example/cli/sfr/collections/all?preview_theme_id=999&_fd=0', { headers }), env(), fetcher);
  assert.equal(denied.status, 403);
  const allowed = await handle(new Request('https://proxy.example/cli/sfr/?preview_theme_id=111&_fd=0&pb=0', { method: 'HEAD', headers }), env(), fetcher);
  assert.equal(allowed.status, 302);
  const forwarded = seen.at(-1)!;
  assert.equal(forwarded.url, 'https://theme-kit-access.shopifyapps.com/cli/sfr/?preview_theme_id=111&_fd=0&pb=0');
  assert.equal(forwarded.method, 'HEAD');
  assert.equal(forwarded.headers['x-shopify-access-token'], realToken);
  assert.equal(forwarded.headers.cookie, '_shopify_essential=abc');
  assert.equal(forwarded.headers.authorization, 'Bearer sf');
  assert.equal(forwarded.headers['cf-connecting-ip'], undefined);
});

test('answers 404 and 405 without unsealing anything', async () => {
  const { seen, fetcher } = upstream(() => json({}));
  assert.equal((await handle(new Request('https://proxy.example/admin/api/2026-07/graphql.json', { method: 'POST' }), env(), fetcher)).status, 404);
  assert.equal((await handle(new Request('https://proxy.example/cli/admin/api/2026-07/graphql.json'), env(), fetcher)).status, 405);
  assert.equal(seen.length, 0);
});

test('serves a public landing page without touching Shopify', async () => {
  const { seen, fetcher } = upstream(() => json({}));
  const response = await handle(new Request('https://proxy.example/'), env(), fetcher);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /^text\/html/);
  assert.match(response.headers.get('content-security-policy') ?? '', /frame-ancestors 'none'/);
  const body = await response.text();
  assert.match(body, /Develop Shopify themes against/);
  assert.match(body, /Shopify theme tokens do not stop at development/);
  assert.match(body, /wrapper is not a credential boundary/);
  assert.match(body, /github\.com\/notambourine\/shopify-cli-condom/);
  assert.match(body, /SHOPIFY_CLI_CONDOM_PROXY=proxy\.example/);
  assert.match(body, /<link rel="icon" type="image\/svg\+xml" href="data:image\/svg\+xml;base64,/);
  const head = await handle(new Request('https://proxy.example/', { method: 'HEAD' }), env(), fetcher);
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal(seen.length, 0);
});

test('honours UPSTREAM_DOMAIN', async () => {
  const { seen, fetcher } = upstream(() => json({ data: { onlineStore: { passwordProtection: { enabled: false } } } }));
  await handle(admin({ query: 'query { onlineStore { passwordProtection { enabled } } }' }), { ...env(), UPSTREAM_DOMAIN: 'upstream.test' }, fetcher);
  assert.equal(seen[0]?.url, 'https://upstream.test/cli/admin/api/2026-07/graphql.json');
});

test('fails closed when a role lookup fails or stops reporting DEVELOPMENT', async () => {
  for (const reply of [
    () => new Response('', { status: 503 }),
    () => new Response('invalid json'),
    () => json({ data: { theme: null } }),
    () => { throw new Error('network failure'); },
  ]) {
    const { seen, fetcher } = upstream(reply);
    assert.equal((await handle(admin(upsert(devGid)), env(), fetcher)).status, 403);
    assert.equal(seen.length, 1);
  }
  let role = 'DEVELOPMENT';
  const { seen, fetcher } = upstream(() => json({ data: { theme: { role } } }));
  assert.equal((await handle(admin(upsert(devGid)), env(), fetcher)).status, 200);
  role = 'MAIN';
  assert.equal((await handle(admin(upsert(devGid)), env(), fetcher)).status, 403);
  assert.equal(seen.length, 3);
});

test('rotating the decryption secret invalidates existing blobs', async () => {
  const { seen, fetcher } = upstream(() => json({}));
  const rotated = { ...env(), PRIVATE_KEY_JWK: JSON.stringify((await generateKeyPair()).privateJwk) };
  assert.equal((await handle(admin(upsert(devGid)), rotated, fetcher)).status, 401);
  assert.equal(seen.length, 0);
});

test('binds CLI preview cookies to a theme and rechecks its role on every request', async () => {
  let role = 'DEVELOPMENT';
  const { seen, fetcher } = upstream((entry) => entry.url.includes('/cli/admin/')
    ? json({ data: { theme: { role } } })
    : new Response(null, { status: 302, headers: [
      ['location', '/password'],
      ['set-cookie', '_shopify_essential=shopify-session; Path=/; Secure; HttpOnly'],
      ['set-cookie', 'storefront_digest=password-session; Path=/; Secure'],
    ] }));
  const headers = { 'X-Shopify-Shop': store, 'X-Shopify-Access-Token': sealed };
  const response = await handle(new Request('https://proxy.example/cli/sfr?preview_theme_id=111', { method: 'HEAD', headers }), env(), fetcher);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  const essential = cookies[0]!.split(';')[0]!;
  const wrapped = essential.slice('_shopify_essential='.length);
  assert.deepEqual(await openPreview({ store, token: realToken }, wrapped), { id: '111', cookie: 'shopify-session' });
  assert.match(cookies[0]!, /; Path=\/; Secure; HttpOnly$/);
  const sessionHeaders = { ...headers, cookie: `${essential}; storefront_digest=password-session; preview_theme_id=999` };
  const render = await handle(new Request('https://proxy.example/cli/sfr/collections/all?_fd=0', { headers: sessionHeaders }), env(), fetcher);
  assert.equal(render.status, 302);
  assert.equal(seen.length, 4);
  assert.match(seen.at(-1)!.url, /preview_theme_id=111/);
  assert.equal(seen.at(-1)!.headers.cookie, 'storefront_digest=password-session; _shopify_essential=shopify-session');
  const password = await handle(new Request('https://proxy.example/cli/sfr/password', {
    method: 'POST', headers: { ...sessionHeaders, 'content-type': 'application/x-www-form-urlencoded' }, body: 'password=fixture',
  }), env(), fetcher);
  assert.equal(password.status, 302);
  assert.equal(seen.at(-1)!.body, 'password=fixture');
  assert.match(seen.at(-1)!.url, /preview_theme_id=111/);
  role = 'MAIN';
  const promoted = await handle(new Request('https://proxy.example/cli/sfr/', { headers: sessionHeaders }), env(), fetcher);
  assert.equal(promoted.status, 403);
  assert.equal(seen.length, 7);
});

test('rejects missing, conflicting, tampered, and foreign preview context before forwarding', async () => {
  const { seen, fetcher } = upstream(() => json({}));
  const context = await sealPreview({ store, token: realToken }, { id: '111', cookie: 'upstream' });
  const foreign = await sealPreview({ store, token: 'shptka_other' }, { id: '111', cookie: 'upstream' });
  const otherStore = await sealPreview({ store: 'other.myshopify.com', token: realToken }, { id: '111', cookie: 'upstream' });
  const tampered = context.replace(/^v1\.[^.]+/, 'v1.' + btoa(JSON.stringify({ id: '999', cookie: 'upstream' })).replace(/=+$/, ''));
  const headers = { 'X-Shopify-Shop': store, 'X-Shopify-Access-Token': sealed };
  for (const [query, cookie] of [
    ['', ''], ['', '_shopify_essential=unsigned'],
    ['?preview_theme_id=111&preview_theme_id=999', ''],
    ['?preview_theme_id[]=111', ''], ['?preview_theme_id=', ''],
    ['?preview_theme_id=111&Preview_Theme_Id=999', ''],
    ['?preview_theme_id=999', `_shopify_essential=${context}`],
    ['', `_shopify_essential=${context}; _shopify_essential=${context}`],
    ['', `_shopify_essential=${foreign}`], ['', `_shopify_essential=${otherStore}`],
    ['', `_shopify_essential=${tampered}`],
  ]) {
    assert.equal((await handle(new Request(`https://proxy.example/cli/sfr/${query}`, { headers: { ...headers, cookie: cookie! } }), env(), fetcher)).status, 403);
  }
  for (const body of ['preview_theme_id=999', 'preview_theme_id%5B%5D=999']) {
    assert.equal((await handle(new Request('https://proxy.example/cli/sfr/?preview_theme_id=111', {
      method: 'POST', headers: { ...headers, 'content-type': 'application/x-www-form-urlencoded' }, body,
    }), env(), fetcher)).status, 403);
  }
  for (const [method, contentType, body, status] of [
    ['DELETE', 'application/x-www-form-urlencoded', '', 405],
    ['POST', 'application/json', '{"preview_theme_id":"999"}', 415],
    ['POST', 'application/x-www-form-urlencoded', 'x'.repeat(10 * 1024 * 1024 + 1), 413],
  ] as const) {
    assert.equal((await handle(new Request('https://proxy.example/cli/sfr/?preview_theme_id=111', {
      method, headers: { ...headers, 'content-type': contentType }, body,
    }), env(), fetcher)).status, status);
  }
  assert.equal(seen.length, 0);
});
