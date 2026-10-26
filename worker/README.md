# Proxy operations

The proxy lets developers run `theme dev` and `theme pull` without holding the
Theme Access token.

It is a Cloudflare Worker with no database. It accepts sealed tokens that
expire and forwards only the Shopify operations that `theme dev` and
`theme pull` need. Queries can read any theme. Before it forwards a mutation or
a storefront preview, the Worker confirms the target is a development theme.

## Deploy

Set the route domain and `CANONICAL_HOST` together in `worker/*.toml`. Before
the Worker is public, add blocking rate limits on `POST /seal` and `/cli/*`,
with enough headroom for theme sync and live reload.

Deploy with separate keys for the server and for admin signing:

```sh
npm ci --ignore-scripts
npm run -s keygen -- --public public.jwk | npx wrangler secret put PRIVATE_KEY_JWK
npx wrangler secret put ADMIN_SSH_PUBLIC_KEY < ~/.ssh/github_auth.pub
npx wrangler deploy
```

The admin key must be ECDSA P-256. Check its fingerprint with `ssh-keygen -lf`
before you upload the public half, and keep the private key in the admin's SSH
agent. You can skip `ADMIN_SSH_PUBLIC_KEY` if you only seal locally.

Before anyone uses the proxy, test theme sync, live reload, password-protected
previews, live-theme pull, refused live-theme writes, and rate limits. When the
pinned Shopify CLI changes, check proxy routing and token redaction again.

## Issue a sealed token

The admin needs Node.js, OpenSSH, the 1Password CLI, and GNU timeout installed
as `gtimeout`.

```sh
npm run -s issue -- \
  --secret 'op://Shopify/example/Theme Access token' \
  --key ~/.ssh/github_auth.pub \
  --store example \
  --label employee
```

Pass `--proxy` for a self-hosted hostname and `--days` to set the expiry. The
command prints the sealed token; send it over a trusted channel. The developer
sets:

```sh
SHOPIFY_CLI_THEME_TOKEN=shptka_sealed_...
SHOPIFY_CLI_CONDOM_PROXY=proxy.example.com
```

Labels are metadata and grant nothing. To renew an expired token, run the same
issue command.

Anyone with a raw Theme Access token and the server's public key can seal a
token locally:

```sh
gtimeout 15 op read 'op://Shopify/example/Theme Access token' | \
  npm run -s seal -- --public public.jwk --store example --days 30 --label employee
```

The admin signature gates hosted issuance. It proves nothing about who holds a
copied token or whether they still work for you.

## Limits

A sealed token is bound to one store and an expiry. Until it expires, it can
read every theme and create, edit, and delete development themes.

You cannot revoke a single token. Rotating the Theme Access token or the server's
private key invalidates every issued token. Changing the admin SSH key
affects only new issuance. Removing someone's GitHub or 1Password access leaves
any token they already copied working.

Whoever runs the Worker can decrypt every token sent to it. If you cannot
extend that trust, host the Worker yourself.

Storefront requests accept GET, HEAD, and form-encoded POST bodies up to 10
MiB. The proxy rejects requests with missing or ambiguous preview context.
Restart Shopify CLI sessions after you upgrade the proxy.
