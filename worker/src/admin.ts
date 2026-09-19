import { json, readBody, reject } from './http.ts';
import { importPublicKey, seal, validatePayload } from './seal.ts';
import { verifyAdminSignature } from './ssh.ts';
import type { Env } from './handler.ts';
import type { Jwk, SealedPayload } from './seal.ts';

export type SealRequest = { aud: string; exp: number; payload: SealedPayload };

export async function issue(request: Request, env: Env, now = Date.now()): Promise<Response> {
  if (request.method !== 'POST') return reject(405, 'Sealing requests must be POST.');
  if (!env.ADMIN_SSH_PUBLIC_KEY) return reject(503, 'Admin sealing is not configured.');
  const signature = request.headers.get('X-Condom-Signature');
  if (!signature || signature.length > 4096) return reject(401, 'An admin SSH signature is required.');
  let body: Uint8Array<ArrayBuffer> | null;
  let armor: string;
  try {
    body = await readBody(request, 2048);
    if (body === null) return reject(413, 'Sealing request exceeds 2048 bytes.');
    armor = atob(signature);
    if (btoa(armor) !== signature) return reject(400, 'Malformed signature encoding.');
  } catch {
    return reject(400, 'Malformed sealing request.');
  }
  if (!await verifyAdminSignature(env.ADMIN_SSH_PUBLIC_KEY, armor, body)) return reject(401, 'Invalid admin signature.');
  let payload: SealedPayload;
  try {
    const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body));
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return reject(400, 'Sealing request must be an object.');
    const claims = value as Record<string, unknown>;
    const seconds = Math.floor(now / 1000);
    if (claims.aud !== `https://${env.CANONICAL_HOST}`) return reject(401, 'Signature is for another service.');
    if (typeof claims.exp !== 'number' || !Number.isSafeInteger(claims.exp) || claims.exp <= seconds || claims.exp > seconds + 60) {
      return reject(401, 'Signature must expire within 60 seconds.');
    }
    payload = validatePayload(claims.payload);
    if (payload.exp <= seconds) return reject(400, 'Token expiry must be in the future.');
  } catch {
    return reject(400, 'Invalid token payload. Use a Theme Access token, myshopify.com store, and integer expiry.');
  }
  let key: CryptoKey;
  try {
    const { kty, n, e } = JSON.parse(env.PRIVATE_KEY_JWK) as Jwk;
    key = await importPublicKey({ kty, n, e });
    if (!('modulusLength' in key.algorithm) || key.algorithm.modulusLength !== 3072) return reject(503, 'Server encryption key must be RSA-3072.');
  } catch {
    return reject(503, 'Server encryption key is not configured correctly.');
  }
  try {
    return json({ token: await seal(key, payload), store: payload.store, exp: payload.exp });
  } catch {
    return reject(400, 'Token payload cannot be sealed; shorten the label.');
  }
}
