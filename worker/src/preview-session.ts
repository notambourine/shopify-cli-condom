import { themeId } from './policy.ts';

export type Credential = { store: string; token: string };
type PreviewSession = { id: string; cookie: string };
const encoder = new TextEncoder();
const encode = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
const decode = (value: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0));
const key = (credential: Credential) => crypto.subtle.importKey('raw', encoder.encode(credential.token), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
const message = (credential: Credential, payload: string) => encoder.encode(JSON.stringify(['condom-preview-v1', credential.store, payload]));

export async function sealPreview(credential: Credential, session: PreviewSession): Promise<string> {
  const payload = encode(encoder.encode(JSON.stringify(session)));
  const signature = await crypto.subtle.sign('HMAC', await key(credential), message(credential, payload));
  return `v1.${payload}.${encode(new Uint8Array(signature))}`;
}

export async function openPreview(credential: Credential, value: string): Promise<PreviewSession | null> {
  if (value.length > 8192) return null;
  const match = /^v1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match?.[1] || !match[2]) return null;
  try {
    if (!await crypto.subtle.verify('HMAC', await key(credential), decode(match[2]), message(credential, match[1]))) return null;
    const session = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decode(match[1]))) as PreviewSession;
    if (themeId(session.id) !== session.id || typeof session.cookie !== 'string' || /[;\r\n]/.test(session.cookie)) return null;
    return session;
  } catch {
    return null;
  }
}
