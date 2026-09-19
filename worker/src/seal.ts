import type { webcrypto } from 'node:crypto';

export type Jwk = webcrypto.JsonWebKey;

export type SealedPayload = { token: string; store: string; exp: number; label?: string };

// The `shptka_` prefix keeps Shopify CLI in Theme Access mode, and a \w-only body keeps the CLI's
// `shptka_\w*` log redaction covering the whole credential.
export const sealedPrefix = 'shptka_sealed_';

const algorithm = { name: 'RSA-OAEP', hash: 'SHA-256' } as const;
const modulusLength = 3072;
// RSA-OAEP ceiling for a 3072-bit modulus with SHA-256: 384 - 2 * 32 - 2.
const maxPayloadBytes = 318;

export const isSealed = (token: string): boolean => token.startsWith(sealedPrefix);

export function normalizeStore(input: string): string {
  const host = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!/^[a-z0-9][a-z0-9-]*(?:\.myshopify\.com)?$/.test(host)) throw new Error('Store must be a Shopify store handle or myshopify.com domain.');
  return host.endsWith('.myshopify.com') ? host : `${host}.myshopify.com`;
}

export async function generateKeyPair(): Promise<{ publicJwk: Jwk; privateJwk: Jwk }> {
  const pair = await crypto.subtle.generateKey(
    { ...algorithm, modulusLength, publicExponent: new Uint8Array([1, 0, 1]) }, true, ['encrypt', 'decrypt'],
  );
  return {
    publicJwk: await crypto.subtle.exportKey('jwk', pair.publicKey),
    privateJwk: await crypto.subtle.exportKey('jwk', pair.privateKey),
  };
}

export const importPublicKey = (jwk: Jwk): Promise<CryptoKey> => crypto.subtle.importKey('jwk', jwk, algorithm, false, ['encrypt']);
export const importPrivateKey = (jwk: Jwk): Promise<CryptoKey> => crypto.subtle.importKey('jwk', jwk, algorithm, false, ['decrypt']);

export function validatePayload(payload: unknown): SealedPayload {
  if (typeof payload !== 'object' || payload === null) throw new Error('Sealed payload must be an object.');
  const { token, store, exp, label } = payload as Record<string, unknown>;
  if (typeof token !== 'string' || !/^shptka_\w+$/.test(token) || isSealed(token)) throw new Error('Sealed payload must carry a Theme Access token.');
  if (typeof store !== 'string' || store !== normalizeStore(store)) throw new Error('Sealed payload store must be a myshopify.com domain.');
  if (typeof exp !== 'number' || !Number.isSafeInteger(exp) || exp <= 0) throw new Error('Sealed payload exp must be a unix timestamp in seconds.');
  if (label !== undefined && typeof label !== 'string') throw new Error('Sealed payload label must be a string.');
  return label === undefined ? { token, store, exp } : { token, store, exp, label };
}

const toHex = (bytes: Uint8Array): string => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

export async function seal(publicKey: CryptoKey, payload: SealedPayload): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(validatePayload(payload)));
  if (bytes.byteLength > maxPayloadBytes) throw new Error(`Sealed payload exceeds ${maxPayloadBytes} bytes; shorten the label.`);
  return sealedPrefix + toHex(new Uint8Array(await crypto.subtle.encrypt(algorithm, publicKey, bytes)));
}

export async function unseal(privateKey: CryptoKey, sealed: string): Promise<SealedPayload> {
  if (!isSealed(sealed)) throw new Error('Token is not sealed.');
  const hex = sealed.slice(sealedPrefix.length);
  if (!/^(?:[0-9a-f]{2})+$/.test(hex)) throw new Error('Sealed token is malformed.');
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(algorithm, privateKey, fromHex(hex));
  } catch {
    throw new Error('Sealed token does not decrypt with this key.');
  }
  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext));
  } catch {
    throw new Error('Sealed payload must be JSON.');
  }
  return validatePayload(payload);
}
