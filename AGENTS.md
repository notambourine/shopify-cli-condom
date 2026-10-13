# shopify-cli-condom

A development-only Shopify CLI wrapper plus an optional proxy.

```
Command isolation         src/
Sealing, proxy, landing   worker/src/
Tests                     beside each package
```

## Safety

- Never let the wrapper or proxy modify, publish, or replace a live theme. Reading any theme is fine.
- Add a flag only after proving it cannot write to a live theme, publish, push, select an environment, or pass arbitrary CLI input.
- Build Shopify CLI arguments from parsed values. Never forward caller arguments.
- Allowlist the child environment. Exclude `SHOPIFY_FLAG_*`, `NODE_OPTIONS`, plugin paths, and unrelated credentials.
- Run commands from a temporary root with an empty `shopify.theme.toml`, linking only recognized theme paths. Cleanup must never modify or remove source theme files.

## Proxy

- Deny by default and allow only pinned CLI operations. Queries may read any theme. Confirm every mutation and preview targets a development theme before forwarding.
- Widen routes, methods, headers, cookies, GraphQL fields, or preview handling only after proving the pinned CLI needs it, and add denial tests with the change.
- Bind sealed credentials to one store and an expiry. Labels are metadata, never authorization. Never claim individual revocation.

## Packaging

- Bundle `@shopify/cli` at an exact version. Consumer `node_modules/.bin` must contain `shopify-cli-condom` and must not contain `shopify`.
- Install with `--ignore-scripts`; dependency install scripts rewrite the bundled tree into an unpackable tarball.
- Publish compiled `dist/`. Node does not strip types under `node_modules`.
- Pack native binaries for every supported platform. npm resolves them per host, and consumers cannot backfill a bundled tree.
- Verify Shopify CLI behavior against the pinned distribution before relying on it.

## Public copy

- Keep the wrapper and proxy boundaries distinct: the wrapper constrains a command, and only the proxy constrains use of a sealed credential.
- Back every README safety claim with a test. State credential and bypass limits plainly.
- Verify install instructions against the published npm version.
- Write in the voice and tokens of the pinned `@notambourine/brand-kit`.

## Checks

Run `npm test` in the root and in `worker/` before pushing. CI repeats both with supply-chain scans.
