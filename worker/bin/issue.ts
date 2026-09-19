#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { issueCredential } from './issue-command.ts';

const usage = 'Usage: issue --secret op://VAULT/ITEM/FIELD --key SSH_KEY --store STORE --label RECIPIENT [--proxy condom.notambourine.com] [--days 30]';

try {
  const { values } = parseArgs({
    options: {
      secret: { type: 'string' }, key: { type: 'string' }, store: { type: 'string' }, label: { type: 'string' },
      proxy: { type: 'string', default: 'condom.notambourine.com' }, days: { type: 'string', default: '30' }, help: { type: 'boolean' },
    }, strict: true,
  });
  if (values.help) {
    console.log(usage);
  } else {
    if (!values.secret || !values.key || !values.store || !values.label) throw new Error(usage);
    const result = await issueCredential({ secret: values.secret, key: values.key, store: values.store, label: values.label, proxy: values.proxy, days: Number(values.days) });
    console.error(`store ${result.store}  proxy ${values.proxy}  expires ${new Date(result.exp * 1000).toISOString()}`);
    process.stdout.write(`${result.token}\n`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Could not issue a credential.');
  process.exitCode = 1;
}
