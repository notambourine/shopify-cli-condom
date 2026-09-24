# shopify-cli-condom

Development-only Shopify CLI wrapper. `src/` owns command isolation. `worker/src/` owns credential sealing, proxy policy, and the landing page. Tests live beside each package.

- Never let the wrapper target, modify, publish, or replace a live theme.
- Bundle and pin `@shopify/cli` exactly. Consumer `node_modules/.bin` must contain `shopify-cli-condom` but not `shopify`.
- Install with `--ignore-scripts`. Dependency install scripts otherwise rewrite the bundled tree into an unpackable tarball.
- Publish compiled `dist/`; Node does not strip types under `node_modules`.
- Pack every supported platform's native binaries. npm resolves them per host, and a consumer cannot backfill a bundled tree.
- Verify Shopify CLI behavior against the pinned distribution before relying on it.
- Accept only explicit development options. Add a flag only after proving it cannot retarget or access a live theme, publish, push, select an environment, or pass arbitrary CLI input.
- Build Shopify CLI arguments from parsed values. Do not forward caller arguments.
- Allowlist the child environment. Exclude `SHOPIFY_FLAG_*`, `NODE_OPTIONS`, plugin paths, and unrelated credentials.
- Isolate repository config with a temporary root and empty `shopify.theme.toml`. Link only recognized theme paths. Cleanup must not modify or remove source theme files.
- Keep the proxy deny-by-default. Allow only pinned CLI operations, and verify every target theme is a development theme before forwarding it.
- Bind sealed credentials to one store and an expiry. Treat labels as metadata, not authorization. Do not claim individual revocation.
- Do not widen proxy routes, methods, headers, cookies, GraphQL fields, or preview handling without proving the pinned CLI needs it and adding denial tests.
- Keep wrapper and proxy boundaries distinct in public copy. The wrapper constrains a command; only the proxy constrains use of a sealed credential.
- Back README safety claims with tests. State credential and bypass limits directly.
- Verify public install instructions against the published npm version.
- Run `npm test` in the root and `worker/` before pushing. CI repeats them with supply-chain scans.
