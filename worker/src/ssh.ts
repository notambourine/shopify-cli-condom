export const sealingNamespace = 'shopify-cli-condom:POST:/seal';
const keyType = 'ecdsa-sha2-nistp256';
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

function reader(bytes: Uint8Array<ArrayBuffer>) {
  let offset = 0;
  const take = (length: number) => {
    if (length > bytes.length - offset) throw new Error('Truncated SSH data.');
    const result = bytes.subarray(offset, offset + length);
    offset += length;
    return result;
  };
  const uint32 = () => {
    const value = take(4);
    return new DataView(value.buffer, value.byteOffset, 4).getUint32(0);
  };
  const string = () => take(uint32());
  return { take, uint32, string, text: () => decoder.decode(string()), done: () => offset === bytes.length };
}

function base64(value: string): Uint8Array<ArrayBuffer> {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error('Invalid base64.');
  const decoded = atob(value);
  if (btoa(decoded) !== value) throw new Error('Non-canonical base64.');
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

const equal = (a: Uint8Array, b: Uint8Array): boolean => a.length === b.length && a.every((byte, index) => byte === b[index]);

function sshString(bytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(4 + bytes.length);
  new DataView(result.buffer).setUint32(0, bytes.length);
  result.set(bytes, 4);
  return result;
}

function scalar(bytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  if (bytes.length === 0 || bytes.length > 33 || (bytes[0] ?? 128) >= 128) throw new Error('Invalid ECDSA scalar.');
  if (bytes[0] === 0) {
    if (bytes.length < 2 || (bytes[1] ?? 0) < 128) throw new Error('Non-canonical ECDSA scalar.');
    bytes = bytes.subarray(1);
  }
  if (bytes.length > 32 || bytes.every((byte) => byte === 0)) throw new Error('Invalid ECDSA scalar.');
  const result = new Uint8Array(32);
  result.set(bytes, 32 - bytes.length);
  return result;
}

export async function verifyAdminSignature(publicKey: string, armored: string, message: Uint8Array<ArrayBuffer>): Promise<boolean> {
  try {
    if (publicKey.length > 1024 || armored.length > 4096 || message.length > 2048) return false;
    const configured = /^(ecdsa-sha2-nistp256) ([A-Za-z0-9+/=]+)(?: [^\r\n]*)?$/.exec(publicKey.trim());
    if (!configured?.[2]) return false;
    const keyBytes = base64(configured[2]);
    const key = reader(keyBytes);
    if (key.text() !== keyType || key.text() !== 'nistp256') return false;
    const point = key.string();
    if (point.length !== 65 || point[0] !== 4 || !key.done()) return false;

    const armor = /^-----BEGIN SSH SIGNATURE-----\n([A-Za-z0-9+/=\n]+)\n-----END SSH SIGNATURE-----\n?$/.exec(armored.replaceAll('\r\n', '\n'));
    if (!armor?.[1]) return false;
    const blob = reader(base64(armor[1].replaceAll('\n', '')));
    if (decoder.decode(blob.take(6)) !== 'SSHSIG' || blob.uint32() !== 1 || !equal(blob.string(), keyBytes)) return false;
    if (blob.text() !== sealingNamespace || blob.string().length !== 0 || blob.text() !== 'sha512') return false;
    const signature = reader(blob.string());
    if (!blob.done() || signature.text() !== keyType) return false;
    const components = reader(signature.string());
    if (!signature.done()) return false;
    const r = scalar(components.string());
    const s = scalar(components.string());
    if (!components.done()) return false;

    const hash = new Uint8Array(await crypto.subtle.digest('SHA-512', message));
    const fields = [encoder.encode('SSHSIG'), sshString(encoder.encode(sealingNamespace)), sshString(new Uint8Array()), sshString(encoder.encode('sha512')), sshString(hash)];
    const signed = new Uint8Array(fields.reduce((length, field) => length + field.length, 0));
    let offset = 0;
    for (const field of fields) { signed.set(field, offset); offset += field.length; }
    const raw = new Uint8Array(64);
    raw.set(r);
    raw.set(s, 32);
    const imported = await crypto.subtle.importKey('raw', point, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, imported, raw, signed);
  } catch {
    return false;
  }
}
