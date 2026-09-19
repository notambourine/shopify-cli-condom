#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { importPublicKey, normalizeStore, seal } from '../src/seal.ts';
import type { Jwk } from '../src/seal.ts';

const usage = 'Usage: gtimeout 15 op read op://VAULT/ITEM/FIELD | seal --public PUBLIC_JWK_PATH --store STORE [--days 30] [--label WHO]';

const { values } = parseArgs({
  options: { public: { type: 'string' }, store: { type: 'string' }, days: { type: 'string', default: '30' }, label: { type: 'string' } },
  strict: true,
});
if (!values.public || !values.store || !/^\d+$/.test(values.days) || process.stdin.isTTY) {
  console.error(usage);
  process.exit(1);
}
const publicKey = await importPublicKey(JSON.parse(await readFile(values.public, 'utf8')) as Jwk);
const token = (await readFile('/dev/stdin', 'utf8')).trim();
const exp = Math.floor(Date.now() / 1000) + Number(values.days) * 86_400;
const sealed = await seal(publicKey, { token, store: normalizeStore(values.store), exp, ...(values.label === undefined ? {} : { label: values.label }) });
console.error(`expires ${new Date(exp * 1000).toISOString()}`);
process.stdout.write(sealed);
