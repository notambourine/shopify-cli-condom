import { execFile } from 'node:child_process';
import { readBody } from '../src/http.ts';
import { normalizeStore, validatePayload } from '../src/seal.ts';
import { sealingNamespace } from '../src/ssh.ts';
import type { SealRequest } from '../src/admin.ts';

export type IssueOptions = { secret: string; key: string; store: string; label: string; proxy: string; days: number };
type Command = (file: string, args: string[], input?: string) => Promise<string>;

export const command: Command = (file, args, input) => new Promise((resolve, reject) => {
  const child = execFile(file, args, { encoding: 'utf8', timeout: 30_000, maxBuffer: 8192 }, (error, stdout) => {
    if (!error) return resolve(stdout);
    if (file === 'gtimeout') {
      reject(new Error(error.code === 124 ? '1Password timed out after 15 seconds; no token was issued.' : 'Could not read the 1Password secret. Check op access.'));
    } else {
      reject(new Error('SSH signing failed. Check the P-256 key and SSH agent access.'));
    }
  });
  child.stdin?.on('error', () => {});
  child.stdin?.end(input);
});

export async function issueCredential(options: IssueOptions, send: typeof fetch = fetch, run: Command = command): Promise<{ token: string; store: string; exp: number }> {
  const url = new URL(`https://${options.proxy}`);
  if (url.host !== options.proxy || url.port || !url.hostname.includes('.')) throw new Error('Proxy must be a hostname without a scheme, path, or port.');
  if (!options.secret.startsWith('op://') || /[\r\n]/.test(options.secret)) throw new Error('Secret must be a 1Password op:// reference.');
  if (!Number.isSafeInteger(options.days) || options.days < 1 || options.days > 365) throw new Error('Days must be an integer between 1 and 365.');
  if (!options.key || !options.label) throw new Error('A signing key and recipient label are required.');
  const store = normalizeStore(options.store);
  const token = (await run('gtimeout', ['15', 'op', 'read', options.secret])).trim();
  const now = Math.floor(Date.now() / 1000);
  const payload = validatePayload({ token, store, exp: now + options.days * 86_400, label: options.label });
  const claims: SealRequest = { aud: url.origin, exp: now + 60, payload };
  const body = JSON.stringify(claims);
  if (Buffer.byteLength(body) > 2048) throw new Error('Sealing request is too large; shorten the label.');
  const signature = await run('ssh-keygen', ['-Y', 'sign', '-n', sealingNamespace, '-O', 'hashalg=sha512', '-f', options.key], body);
  let response: Response;
  try {
    response = await send(new URL('/seal', url), {
      method: 'POST', body, redirect: 'error', signal: AbortSignal.timeout(15_000),
      headers: { 'content-type': 'application/json', 'X-Condom-Signature': Buffer.from(signature).toString('base64') },
    });
  } catch {
    throw new Error('Could not reach the sealing endpoint over HTTPS. No redirect was followed.');
  }
  if (!response.ok) {
    await response.body?.cancel();
    if (response.status === 401) throw new Error('Admin signature rejected. Check the configured public key and system clock.');
    if (response.status === 429) throw new Error('Sealing rate limit reached. Try again later.');
    if (response.status === 503) throw new Error('Admin sealing is not configured on the proxy.');
    throw new Error(`Sealing failed (HTTP ${response.status}). Check the hostname, store, expiry, and label length.`);
  }
  try {
    const bytes = await readBody(response, 2048);
    if (!bytes) throw new Error();
    const result: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof result !== 'object' || result === null) throw new Error();
    const value = result as Record<string, unknown>;
    if (typeof value.token !== 'string' || !/^shptka_sealed_[0-9a-f]{768}$/.test(value.token) || value.store !== store || value.exp !== payload.exp) throw new Error();
    return { token: value.token, store, exp: payload.exp };
  } catch {
    throw new Error('Proxy returned an invalid sealed credential.');
  }
}
