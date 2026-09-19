#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { writeFile } from 'node:fs/promises';
import { generateKeyPair } from '../src/seal.ts';

const { values } = parseArgs({ options: { public: { type: 'string' } }, strict: true });
if (!values.public) {
  console.error('Usage: keygen --public PUBLIC_JWK_PATH   # private JWK on stdout for `wrangler secret put PRIVATE_KEY_JWK`');
  process.exit(1);
}
const { publicJwk, privateJwk } = await generateKeyPair();
await writeFile(values.public, `${JSON.stringify(publicJwk)}\n`, { flag: 'wx' });
process.stdout.write(JSON.stringify(privateJwk));
