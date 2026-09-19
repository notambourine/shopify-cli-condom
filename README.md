# shopify-cli-condom

Let agents, interns, and developers build themes against a real store without giving routine commands a path to its live theme.

Its only command, `dev`, runs a pinned Shopify CLI with development-theme allocation. It rejects theme IDs, live-theme access, publishing, pushing, environments, and arbitrary CLI arguments.

Shopify theme development has no production ACL. A Theme Access token covers the store, and the standard CLI can use it to target live themes. Instructions in `AGENTS.md` reduce mistakes but do not enforce access. This wrapper narrows the available command surface; the optional proxy also keeps the raw Shopify credential out of the developer environment and rechecks that every scoped operation targets a development theme.

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

A stolen sealed token can create, edit, and delete development themes on its bound store until expiry. Early individual revocation is unavailable. Rotate the Theme Access token or server decryption key to invalidate credentials. Changing the admin SSH key affects new issuance only; removing someone's GitHub or 1Password access does not revoke copied credentials. The Worker operator can decrypt every received token. Self-host if you do not trust the operator.

Anyone with a raw Theme Access token and the server's public key can seal locally. The admin signature controls hosted issuance, not membership in an employee list.

The proxy rechecks theme roles before each scoped operation, including cookie-based previews. Missing or ambiguous preview context is rejected. Restart CLI sessions after upgrading the proxy. Storefront requests support GET, HEAD, and form-encoded POST up to 10 MiB.

### Host the proxy

Set the domain and `CANONICAL_HOST` together in `worker/*.toml`. Configure blocking rate limits for `POST /seal` and `/cli/*` before exposing the service; allow enough traffic for sync and live reload.

From `worker/`, deploy with separate server-encryption and admin-signing keys:

```sh
npm ci --ignore-scripts
npm run -s keygen -- --public public.jwk | npx wrangler secret put PRIVATE_KEY_JWK
npx wrangler secret put ADMIN_SSH_PUBLIC_KEY < ~/.ssh/github_auth.pub
npx wrangler deploy
```

The admin key must be ECDSA P-256. Verify its fingerprint with `ssh-keygen -lf` before uploading its public half. Keep the private half in the admin's SSH agent. Local-only sealing can omit `ADMIN_SSH_PUBLIC_KEY`.

### Issue credentials

The admin needs Node.js, OpenSSH, the 1Password CLI, and GNU timeout as `gtimeout`. From `worker/`:

```sh
npm run -s issue -- \
  --secret 'op://Shopify/example/Theme Access token' \
  --key ~/.ssh/github_auth.pub \
  --store example \
  --label employee
```

Use `--proxy` for a self-hosted hostname and `--days` for expiry. Stdout contains the sealed token. Deliver it through a trusted channel; recipients set `SHOPIFY_CLI_THEME_TOKEN` to that value and `SHOPIFY_CLI_CONDOM_PROXY` to the hostname. Labels do not authenticate recipients. Renew with the same command.

Self-hosters can seal locally:

```sh
gtimeout 15 op read 'op://Shopify/example/Theme Access token' | \
  npm run -s seal -- --public public.jwk --store example --days 30 --label employee
```

## Development

```sh
npm ci --ignore-scripts
npm run lint && npm run typecheck && npm test
```

Node runs the TypeScript sources directly. `npm pack` compiles the consumer `dist/` because Node does not strip types under `node_modules`. Installing without `--ignore-scripts` leaves an unpackable bundled tree.

Tests cover rejected targeting, environment and config isolation, temporary themes, and installed binary shape without contacting Shopify. `worker/` has its own install and `npm test` for sealing, the GraphQL allowlist, and fake-upstream requests. Before deployment, smoke-test sync, live reload, password-protected previews, denied live-theme operations, and rate limits. Recheck proxy routing and token redaction against the pinned distribution on CLI upgrades.

Shopify references: [theme dev](https://shopify.dev/docs/api/shopify-cli/theme/theme-dev) and [environment precedence](https://shopify.dev/docs/storefronts/themes/tools/cli/environments).
