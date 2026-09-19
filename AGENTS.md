# shopify-cli-condom

Development-only Shopify CLI wrapper. `src/` owns argument, environment, and temporary-theme policy. `bin/` launches the bundled CLI. `test/` covers policy and consumer installs.

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
- Back README safety claims with tests. State credential and bypass limits directly.
- Run `npm test` before pushing. CI repeats it with supply-chain scans.
