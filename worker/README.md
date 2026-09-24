# Proxy operations

Run the proxy when developers need Shopify theme previews without receiving the
raw Theme Access token.

The database-free Cloudflare Worker accepts sealed, expiring credentials. It
forwards only the Shopify operations required for development themes and checks
the target theme's role before every scoped operation, including storefront
previews.

## Host the proxy

Set the domain and `CANONICAL_HOST` together in `worker/*.toml`. Configure
blocking rate limits for `POST /seal` and `/cli/*` before exposing the Worker.
Allow enough traffic for theme sync and live reload.

Deploy with separate server-encryption and admin-signing keys:

```sh
npm ci --ignore-scripts
npm run -s keygen -- --public public.jwk | npx wrangler secret put PRIVATE_KEY_JWK
npx wrangler secret put ADMIN_SSH_PUBLIC_KEY < ~/.ssh/github_auth.pub
npx wrangler deploy
```

The admin key must be ECDSA P-256. Verify its fingerprint with `ssh-keygen -lf`
before uploading the public key. Keep the private key in the admin's SSH agent.
Local-only sealing can omit `ADMIN_SSH_PUBLIC_KEY`.

Smoke-test theme sync, live reload, password-protected previews, denied
live-theme operations, and rate limits before use. Recheck proxy routing and
token redaction whenever the pinned Shopify CLI changes.

## Issue a credential

The admin needs Node.js, OpenSSH, the 1Password CLI, and GNU timeout available
as `gtimeout`.

```sh
npm run -s issue -- \
  --secret 'op://Shopify/example/Theme Access token' \
  --key ~/.ssh/github_auth.pub \
  --store example \
  --label employee
```

Use `--proxy` for a self-hosted hostname and `--days` for expiry. The command
prints the sealed credential. Send it through a trusted channel. The recipient
sets:

```sh
SHOPIFY_CLI_THEME_TOKEN=shptka_sealed_...
SHOPIFY_CLI_CONDOM_PROXY=proxy.example.com
```

Labels are metadata, not access control. Renew an expired credential with the
same issue command.

Anyone with a raw Theme Access token and the server's public key can seal a
credential locally:

```sh
gtimeout 15 op read 'op://Shopify/example/Theme Access token' | \
  npm run -s seal -- --public public.jwk --store example --days 30 --label employee
```

The admin signature controls hosted issuance. It does not prove employment or
ownership of a copied credential.

## Limits and revocation

A sealed credential is bound to one store and an expiry. Until then, it can
create, edit, and delete development themes. Individual revocation is not
available. Rotate the Theme Access token or server decryption key to invalidate
all issued credentials. Changing the admin SSH key affects new issuance only.
Removing a person's GitHub or 1Password access does not revoke a credential they
already copied.

The Worker operator can decrypt every credential sent to the proxy. Self-host
the Worker if that trust is unacceptable.

Storefront requests support GET, HEAD, and form-encoded POST bodies up to 10
MiB. Missing or ambiguous preview context is rejected. Restart Shopify CLI
sessions after a proxy upgrade.
