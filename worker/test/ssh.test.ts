import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyAdminSignature } from '../src/ssh.ts';
import { signingKey } from './ssh-fixtures.ts';

const admin = signingKey();
const other = signingKey();
const body = '{"aud":"https://proxy.example","exp":2000000000,"payload":{"token":"shptka_fixture"}}';
const bytes = new TextEncoder().encode(body);
const signature = admin.sign(body);
const wire = Buffer.from(signature.split('\n').slice(1, -2).join(''), 'base64');
const armor = (blob: Buffer) => `-----BEGIN SSH SIGNATURE-----\n${blob.toString('base64')}\n-----END SSH SIGNATURE-----\n`;
const string = (value: Buffer | string) => {
  const field = Buffer.from(value);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(field.length);
  return Buffer.concat([length, field]);
};
const fields: Buffer[] = [];
for (let offset = 10; offset < wire.length;) {
  const size = wire.readUInt32BE(offset);
  fields.push(wire.subarray(offset + 4, offset + 4 + size));
  offset += size + 4;
}
const replace = (index: number, value: Buffer | string) => armor(Buffer.concat([wire.subarray(0, 10), ...fields.map((field, position) => string(position === index ? value : field))]));

test('accepts a real OpenSSH P-256 signature independently verified by OpenSSH', async () => {
  admin.verify(body, signature);
  assert.equal(await verifyAdminSignature(admin.publicKey, signature, bytes), true);
  assert.equal(await verifyAdminSignature(admin.publicKey, signature.replaceAll('\n', '\r\n'), bytes), true);
});

test('rejects another key, body, namespace, hash, and algorithm', async () => {
  const rsa = signingKey('rsa', '2048');
  const ed = signingKey('ed25519');
  for (const [key, sig, message] of [
    [other.publicKey, signature, bytes],
    [admin.publicKey, other.sign(body), bytes],
    [admin.publicKey, signature, new TextEncoder().encode(body + '\n')],
    [admin.publicKey, admin.sign(body, 'git'), bytes],
    [admin.publicKey, admin.sign(body, undefined, 'sha256'), bytes],
    [rsa.publicKey, rsa.sign(body), bytes],
    [ed.publicKey, ed.sign(body), bytes],
    [admin.publicKey.replace('ecdsa-sha2-nistp256', 'sk-ecdsa-sha2-nistp256@openssh.com'), signature, bytes],
  ] as const) assert.equal(await verifyAdminSignature(key, sig, message), false);
});

test('rejects malformed or noncanonical armor and bounded wire fields', async () => {
  const version = Buffer.from(wire);
  version.writeUInt32BE(2, 6);
  const length = Buffer.from(wire);
  length.writeUInt32BE(0xffffffff, 10);
  const tampered = Buffer.from(wire);
  tampered[tampered.length - 1] = (tampered.at(-1) ?? 0) ^ 1;
  for (const sig of [
    armor(version), armor(length), armor(tampered), armor(wire.subarray(0, -1)), armor(Buffer.concat([wire, Buffer.from([0])])),
    replace(1, ''), replace(2, 'reserved'), replace(3, 'sha256'),
    replace(4, Buffer.concat([string('ssh-ed25519'), string(Buffer.alloc(64))])),
    signature + 'outside', 'outside' + signature, signature.replace('SSH SIGNATURE', 'INVALID'),
    signature.replace('\n', '\n!'), signature.repeat(20),
    '-----BEGIN SSH SIGNATURE-----\nAB==\n-----END SSH SIGNATURE-----',
  ]) assert.equal(await verifyAdminSignature(admin.publicKey, sig, bytes), false);
  assert.equal(await verifyAdminSignature(admin.publicKey.repeat(20), signature, bytes), false);
  assert.equal(await verifyAdminSignature(admin.publicKey, signature, new Uint8Array(2049)), false);
});

test('rejects zero, negative, overlong, and redundantly padded ECDSA scalars', async () => {
  for (const value of [Buffer.alloc(0), Buffer.from([0]), Buffer.from([128]), Buffer.alloc(34, 1), Buffer.from([0, 1])]) {
    const inner = Buffer.concat([string(value), string(Buffer.from([1]))]);
    const forged = replace(4, Buffer.concat([string('ecdsa-sha2-nistp256'), string(inner)]));
    assert.equal(await verifyAdminSignature(admin.publicKey, forged, bytes), false);
  }
});
