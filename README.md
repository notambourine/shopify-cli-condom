# shopify-cli-condom

Develop themes against a real store without exposing its live theme to routine commands.

Its only command, `dev`, runs a pinned Shopify CLI with development-theme allocation. It rejects theme IDs, live-theme access, publishing, pushing, environments, and arbitrary CLI arguments.

## Usage

Requires Node.js 24 or newer. Until published, install a local tarball in the theme project.

Add a script:

```json
{
  "scripts": {
    "dev": "shopify-cli-condom dev --store your-store"
  }
}
```

Provide `SHOPIFY_CLI_THEME_TOKEN` through a secret manager, then run:

```sh
npm run dev
```

Themes need `layout/` and `templates/`. Run `shopify-cli-condom --help` for all options.

## What it enforces

- The wrapper accepts only `dev` and builds the Shopify CLI command.
- Shopify receives no theme ID, live-theme flag, environment, `push`, or `publish`.
- Repository `shopify.theme.toml` files cannot affect the command.
- Each session uses fresh CLI storage, excluding cached theme IDs and user plugins.
- Inherited `SHOPIFY_FLAG_*`, `NODE_OPTIONS`, and unrelated environment variables are removed.
- The bundled Shopify CLI is pinned. Consumer `node_modules/.bin` exposes `shopify-cli-condom`, not `shopify`.
- A separate Shopify CLI on `PATH` triggers a bypass warning.

Shopify CLI receives a temporary directory with an empty `shopify.theme.toml` and links to the working tree. Edits remain live. Restart after adding a top-level theme directory that did not exist at startup.

Each run allocates a new development theme. CLI login state and cached storefront passwords are not inherited.

The theme's `.shopifyignore` is preserved. Ignore lists defined in TOML environments are not. Proxy environment variables are not supported.

Normal exit and handled signals remove the temporary directory; `SIGKILL` can leave it behind. Cleanup never removes the working tree.

## Security boundary

The command limits accidents, not credentials.

Theme tokens cover an entire store. A production token can reach the live theme through another Shopify CLI, a direct API request, or any HTTP client. Keep production tokens in CI-only secrets. Use staging-store tokens on development machines when possible. Retain production deployment controls and agent command guards; this package installs no agent hook.

### Sealed tokens through a proxy

`worker/` is a database-free Cloudflare Worker that forwards only development-theme operations to Shopify. An admin reads a Theme Access token from 1Password and authorizes sealing with a configured SSH key. Developers receive `shptka_sealed_...`, set `SHOPIFY_CLI_CONDOM_PROXY` to the Worker hostname, and use the wrapper without SSH keys or raw Shopify credentials. Self-hosters can seal locally.

A stolen sealed token can create, edit, and delete development themes on its bound store until expiry. Early individual revocation is unavailable. Rotate the Theme Access token or server decryption key to invalidate credentials. The Worker operator can decrypt every received token. Self-host if you do not trust the operator. See [operator and recipient setup](docs/theme-token-proxy.md).

## Development

```sh
npm ci --ignore-scripts
npm run lint && npm run typecheck && npm test
```

Node runs the TypeScript sources directly. `npm pack` compiles the consumer `dist/` because Node does not strip types under `node_modules`. Installing without `--ignore-scripts` leaves an unpackable bundled tree.

Tests cover rejected targeting, environment and config isolation, temporary themes, and installed binary shape without contacting Shopify. `worker/` has its own install and `npm test` for sealing, the GraphQL allowlist, and fake-upstream requests. Live reload, authentication, and the proxy path need a manual smoke test against a development theme.

Shopify references: [theme dev](https://shopify.dev/docs/api/shopify-cli/theme/theme-dev) and [environment precedence](https://shopify.dev/docs/storefronts/themes/tools/cli/environments).
