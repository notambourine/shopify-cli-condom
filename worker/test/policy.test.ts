import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, themeId } from '../src/policy.ts';
import type { Decision } from '../src/policy.ts';

const gid = 'gid://shopify/OnlineStoreTheme/123';

function allowed(decision: Decision) {
  assert.ok(decision.allow, decision.allow ? '' : decision.reason);
  return decision;
}

function denied(decision: Decision, reason: RegExp) {
  assert.ok(!decision.allow);
  assert.match(decision.reason, reason);
}

test('allows development theme creation and denies every other role', () => {
  const query = 'mutation themeCreate($name: String!, $role: ThemeRole!) { themeCreate(name: $name, role: $role) { theme { id role } userErrors { message } } }';
  allowed(evaluate({ query, variables: { name: 'Dev', role: 'DEVELOPMENT' } }));
  allowed(evaluate({ query: 'mutation { themeCreate(name: "Dev", role: DEVELOPMENT) { theme { id } } }' }));
  denied(evaluate({ query, variables: { name: 'Dev', role: 'UNPUBLISHED' } }), /DEVELOPMENT/);
  denied(evaluate({ query, variables: { name: 'Dev' } }), /DEVELOPMENT/);
  denied(evaluate({ query: 'mutation { themeCreate(name: "Dev") { theme { id } } }' }), /DEVELOPMENT/);
});

test('resolves variable defaults instead of trusting the variables object alone', () => {
  const query = 'mutation themeCreate($role: ThemeRole = MAIN) { themeCreate(name: "x", role: $role) { theme { id } } }';
  denied(evaluate({ query, variables: {} }), /DEVELOPMENT/);
  allowed(evaluate({ query, variables: { role: 'DEVELOPMENT' } }));
});

test('scopes theme reads and writes to the referenced theme id', () => {
  for (const [query, variables] of [
    ['mutation themeFilesUpsert($files: [OnlineStoreThemeFilesUpsertFileInput!]!, $themeId: ID!) { themeFilesUpsert(files: $files, themeId: $themeId) { upsertedThemeFiles { filename } } }', { files: [], themeId: gid }],
    ['mutation themeFilesDelete($themeId: ID!, $files: [String!]!) { themeFilesDelete(themeId: $themeId, files: $files) { deletedThemeFiles { filename } } }', { themeId: gid, files: ['a'] }],
    ['mutation themeDelete($id: ID!) { themeDelete(id: $id) { deletedThemeId } }', { id: gid }],
    ['mutation themeUpdate($id: ID!, $input: OnlineStoreThemeInput!) { themeUpdate(id: $id, input: $input) { theme { id } } }', { id: gid, input: { name: 'x' } }],
    ['query getTheme($id: ID!) { theme(id: $id) { id name role } }', { id: gid }],
    ['query getThemeFileChecksums($id: ID!, $after: String) { theme(id: $id) { files(first: 250, after: $after) { nodes { filename checksumMd5 } } } }', { id: gid }],
    [`query { theme(id: "${gid}") { id } }`, undefined],
  ] as const) {
    const decision = allowed(evaluate({ query, variables }));
    assert.deepEqual(decision.allow && decision.themeIds, ['123']);
  }
  denied(evaluate({ query: 'mutation themeDelete($id: ID!) { themeDelete(id: $id) { deletedThemeId } }', variables: {} }), /theme id/);
  denied(evaluate({ query: 'query { theme(id: "gid://shopify/OnlineStoreTheme/123?x=1") { id } }' }), /theme id/);
});

test('denies publishing, duplication, unfiltered listings, and anything outside themes', () => {
  denied(evaluate({ query: `mutation { themePublish(id: "${gid}") { theme { id } } }` }), /themePublish/);
  denied(evaluate({ query: `mutation { themeDuplicate(id: "${gid}", name: "copy") { theme { id } } }` }), /themeDuplicate/);
  denied(evaluate({ query: 'query getThemes($after: String) { themes(first: 50, after: $after) { nodes { id role } } }' }), /roles/);
  denied(evaluate({ query: 'query { themes(first: 50, roles: [DEVELOPMENT, MAIN]) { nodes { id } } }' }), /roles/);
  denied(evaluate({ query: 'query { shop { name } }' }), /shop is not allowed/);
  denied(evaluate({ query: 'query { customers(first: 1) { nodes { id } } }' }), /customers/);
  denied(evaluate({ query: 'subscription { x }' }), /Subscriptions|not allowed/);
});

test('allows the read-only queries theme dev needs', () => {
  allowed(evaluate({ query: 'query findDevelopmentThemeByName($name: String!) { themes(first: 1, names: [$name], roles: [DEVELOPMENT]) { nodes { id name role } } }', variables: { name: 'x' } }));
  allowed(evaluate({ query: 'query OnlineStorePasswordProtection { onlineStore { passwordProtection { enabled } } }' }));
  allowed(evaluate({ query: 'query metafieldDefinitionsByOwnerType($ownerType: MetafieldOwnerType!) { metafieldDefinitions(ownerType: $ownerType, first: 250) { nodes { key } } }', variables: { ownerType: 'PRODUCT' } }));
});

test('denies batching, aliases around the allowlist, fragments, and garbage', () => {
  denied(evaluate({ query: `mutation { a: themeDelete(id: "${gid}") { deletedThemeId } b: themePublish(id: "${gid}") { theme { id } } }` }), /one root field/);
  denied(evaluate({ query: `query A { theme(id: "${gid}") { id } } query B { shop { name } }` }), /one operation/);
  denied(evaluate({ query: `fragment F on OnlineStoreTheme { id } query { theme(id: "${gid}") { ...F } }` }), /one operation/);
  denied(evaluate({ query: `mutation { publish: themePublish(id: "${gid}") { theme { id } } }` }), /themePublish/);
  denied(evaluate({ query: 'not graphql' }), /parse error/);
  denied(evaluate({ query: 'query { theme(id: "1") { id } }', variables: [] as unknown as Record<string, unknown> }), /Variables/);
});

test('extracts numeric ids from GIDs and rejects anything else', () => {
  assert.equal(themeId(gid), '123');
  assert.equal(themeId('123'), '123');
  assert.equal(themeId('gid://shopify/Product/123'), null);
  assert.equal(themeId(123), null);
  assert.equal(themeId(`${gid}/x`), null);
});
