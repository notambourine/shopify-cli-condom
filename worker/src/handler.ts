import { evaluate, themeId } from './policy.ts';
import { importPrivateKey, normalizeStore, unseal } from './seal.ts';
import type { Jwk, SealedPayload } from './seal.ts';
import { issue } from './admin.ts';
import { readBody, reject } from './http.ts';
import { openPreview, sealPreview } from './preview-session.ts';
import type { Credential } from './preview-session.ts';

export type Env = { PRIVATE_KEY_JWK: string; CANONICAL_HOST: string; ADMIN_SSH_PUBLIC_KEY?: string; UPSTREAM_DOMAIN?: string };
export type Upstream = (request: Request) => Promise<Response>;

const defaultUpstream = 'theme-kit-access.shopifyapps.com';
const adminPath = /^\/cli\/admin\/api\/[^/]+\/graphql\.json$/;

let cachedKey: { jwk: string; key: Promise<CryptoKey> } | undefined;
async function privateKey(env: Env): Promise<CryptoKey> {
  try {
    if (cachedKey?.jwk !== env.PRIVATE_KEY_JWK) cachedKey = { jwk: env.PRIVATE_KEY_JWK, key: importPrivateKey(JSON.parse(env.PRIVATE_KEY_JWK) as Jwk) };
    return await cachedKey.key;
  } catch {
    throw new Error('Server decryption key is not configured correctly.');
  }
}

async function lookupRole(upstream: Upstream, target: URL, credential: Credential, id: string): Promise<string | null> {
  const response = await upstream(new Request(target, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Shopify-Shop': credential.store, 'X-Shopify-Access-Token': credential.token },
    body: JSON.stringify({ query: `query { theme(id: "gid://shopify/OnlineStoreTheme/${id}") { role } }` }),
    redirect: 'manual',
  })).catch(() => null);
  if (!response?.ok) return null;
  const json = await response.json().catch(() => null) as { data?: { theme?: { role?: string } | null } } | null;
  return json?.data?.theme?.role ?? null;
}

async function admin(request: Request, target: URL, credential: Credential, upstream: Upstream): Promise<Response> {
  const body = await request.text();
  let graphql: unknown;
  try {
    graphql = JSON.parse(body);
  } catch {
    return reject(400, 'Body must be JSON.');
  }
  if (typeof graphql !== 'object' || graphql === null || typeof (graphql as { query?: unknown }).query !== 'string') {
    return reject(400, 'Body must include a GraphQL query.');
  }
  const decision = evaluate(graphql as { query: string; variables?: Record<string, unknown> | null });
  if (!decision.allow) return reject(403, decision.reason);
  for (const id of decision.themeIds) {
    if (await lookupRole(upstream, target, credential, id) !== 'DEVELOPMENT') {
      return reject(403, `Theme ${id} is not a development theme.`);
    }
  }
  const headers = new Headers({ 'X-Shopify-Shop': credential.store, 'X-Shopify-Access-Token': credential.token });
  for (const name of ['accept', 'content-type', 'user-agent']) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  return upstream(new Request(target, { method: 'POST', headers, body, redirect: 'manual' }));
}

async function storefront(request: Request, target: URL, credential: Credential, upstream: Upstream): Promise<Response> {
  if (!['GET', 'HEAD', 'POST'].includes(request.method)) return reject(405, 'Unsupported storefront method.');
  const selectors = [...target.searchParams.keys()].filter((name) => /^preview_theme_id/i.test(name));
  if (selectors.length > 1 || selectors.some((name) => name !== 'preview_theme_id')) {
    return reject(403, 'Ambiguous preview theme.');
  }
  const preview = target.searchParams.get('preview_theme_id');
  const cookies = (request.headers.get('cookie') ?? '').split(';').map((part) => part.trim());
  const essential = cookies.filter((part) => part.startsWith('_shopify_essential='));
  if (essential.length > 1) return reject(403, 'Ambiguous preview session.');
  const session = essential[0] ? await openPreview(credential, essential[0].slice('_shopify_essential='.length)) : null;
  if (essential.length && !session) return reject(403, 'Invalid preview session.');
  const id = preview === null ? session?.id : themeId(preview);
  if (!id || (session && session.id !== id)) return reject(403, 'A matching development preview is required.');
  let body: Uint8Array<ArrayBuffer> | undefined;
  if (request.method === 'POST') {
    if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/x-www-form-urlencoded') {
      return reject(415, 'Storefront POST requests must be form encoded.');
    }
    const bytes = await readBody(request, 10 * 1024 * 1024);
    if (bytes === null) return reject(413, 'Storefront form exceeds 10 MiB.');
    const form = new URLSearchParams(new TextDecoder().decode(bytes));
    if ([...form.keys()].some((name) => /^preview_theme_id/i.test(name))) return reject(403, 'Preview theme must not be supplied in the body.');
    body = bytes;
  }
  const adminTarget = new URL(`https://${target.host}/cli/admin/api/unstable/graphql.json`);
  if (await lookupRole(upstream, adminTarget, credential, id) !== 'DEVELOPMENT') {
    return reject(403, `Theme ${id} is not a development theme.`);
  }
  target.searchParams.set('preview_theme_id', id);
  const headers = new Headers();
  for (const name of ['accept', 'content-type', 'user-agent', 'authorization', 'signature', 'signature-input', 'signature-agent']) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  const forwardedCookies = cookies.filter((part) => part.startsWith('storefront_digest='));
  if (session) forwardedCookies.push(`_shopify_essential=${session.cookie}`);
  if (forwardedCookies.length) headers.set('cookie', forwardedCookies.join('; '));
  headers.set('X-Shopify-Shop', credential.store);
  headers.set('X-Shopify-Access-Token', credential.token);
  const response = await upstream(new Request(target, { method: request.method, headers, body, redirect: 'manual' }));
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete('set-cookie');
  responseHeaders.set('cache-control', 'no-store');
  // The pinned CLI retains _shopify_essential but discards unrelated session cookies.
  for (const cookie of response.headers.getSetCookie()) {
    const match = /^_shopify_essential=([^;]*)(.*)$/.exec(cookie);
    const wrapped = match ? `_shopify_essential=${await sealPreview(credential, { id, cookie: match[1] ?? '' })}${match[2] ?? ''}` : cookie;
    responseHeaders.append('set-cookie', wrapped);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
}

export async function authenticate(env: Env, headers: Headers, now = Date.now()): Promise<{ credential: Credential } | { response: Response }> {
  const shop = headers.get('X-Shopify-Shop');
  const sealed = headers.get('X-Shopify-Access-Token');
  if (!shop || !sealed) return { response: reject(401, 'Missing X-Shopify-Shop or X-Shopify-Access-Token.') };
  let payload: SealedPayload;
  try {
    payload = await unseal(await privateKey(env), sealed);
  } catch (error) {
    return { response: reject(401, error instanceof Error ? error.message : String(error)) };
  }
  if (payload.exp * 1000 <= now) return { response: reject(401, 'Sealed token expired.') };
  let store: string;
  try {
    store = normalizeStore(shop);
  } catch {
    return { response: reject(401, 'X-Shopify-Shop is not a Shopify store.') };
  }
  if (payload.store !== store) return { response: reject(401, 'Sealed token is bound to another store.') };
  return { credential: { store, token: payload.token } };
}

export async function handle(request: Request, env: Env, upstream: Upstream = fetch): Promise<Response> {
  const url = new URL(request.url);
  if (!env.CANONICAL_HOST) return reject(503, 'Proxy hostname is not configured.');
  if (url.protocol !== 'https:' || url.host !== env.CANONICAL_HOST) return reject(421, 'Request must use the configured proxy hostname over HTTPS.');
  if (url.pathname === '/seal') {
    if (url.search) return reject(400, 'Sealing requests cannot include query parameters.');
    return issue(request, env);
  }
  const target = new URL(url.pathname + url.search, `https://${env.UPSTREAM_DOMAIN ?? defaultUpstream}`);
  if (adminPath.test(url.pathname)) {
    if (request.method !== 'POST') return reject(405, 'Admin API requests must be POST.');
  } else if (url.pathname !== '/cli/sfr' && !url.pathname.startsWith('/cli/sfr/')) {
    return reject(404, 'Not proxied.');
  }
  const auth = await authenticate(env, request.headers);
  if ('response' in auth) return auth.response;
  return adminPath.test(url.pathname)
    ? admin(request, target, auth.credential, upstream)
    : storefront(request, target, auth.credential, upstream);
}
