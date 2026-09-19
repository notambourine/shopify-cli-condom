# Theme token proxy

Give developers sealed credentials that can reach only development themes. The admin keeps the real Theme Access token in 1Password; `worker/` decrypts requests and enforces the Shopify operation policy without a database.

## Admin setup

Use two separate keys. The Worker holds an RSA decryption secret. The admin holds an ECDSA P-256 SSH key, with only its public key uploaded to the Worker. GitHub is not involved; employees need neither key.

Set the domain and `CANONICAL_HOST` together in `worker/*.toml`. The checked-in deployment targets `condom.notambourine.com`; self-hosters replace both with their own hostname. Alternate Worker and preview hostnames are disabled.

From `worker/`:

```sh
npm ci --ignore-scripts
npm run -s keygen -- --public public.jwk | npx wrangler secret put PRIVATE_KEY_JWK
npx wrangler secret put ADMIN_SSH_PUBLIC_KEY < ~/.ssh/github_auth.pub
npx wrangler deploy
```

Choose the public file for the P-256 key available through your SSH agent. Verify its fingerprint with `ssh-keygen -lf` before uploading it. An operator using only local sealing can omit the admin public key; the sealing endpoint then stays disabled.

Before exposing the service, configure zone rate limits for `POST /seal` and `/cli/*`. Use blocking responses, not browser challenges. Size the proxy limit for theme sync and live reload, then verify it in the deployment smoke test. The hostname check applies to both paths.

## Issue a credential

The admin machine needs Node.js, OpenSSH, the 1Password CLI, and GNU timeout available as `gtimeout`. Use the same SSH key whose public half was uploaded. A public key file works when its private key is available through the SSH agent.

From `worker/`:

```sh
npm run -s issue -- \
  --secret 'op://Shopify/example/Theme Access token' \
  --key ~/.ssh/github_auth.pub \
  --store example \
  --label employee
```

For self-hosting, add `--proxy your-proxy.example.com`. Use `--days` to choose an expiry. The helper reads 1Password with a 15-second timeout, signs the exact request through stdin, and sends the raw token only in the HTTPS body. It refuses redirects. Stdout contains only the sealed token; stderr reports the store, proxy, and expiry.

Deliver the sealed token through 1Password or an existing trusted channel. Set the recipient's `SHOPIFY_CLI_THEME_TOKEN` to that value and `SHOPIFY_CLI_CONDOM_PROXY` to the proxy hostname. The recipient runs the usual wrapper command. Labels identify recipients for the admin; they do not authenticate the person using a copied token.

Self-hosters can still seal locally wherever the raw token already lives:

```sh
gtimeout 15 op read 'op://Shopify/example/Theme Access token' | \
  npm run -s seal -- --public public.jwk --store example --days 30 --label employee
```

## Credential and request contracts

The existing `shptka_sealed_<hex>` format remains RSA-OAEP-3072 ciphertext containing a Theme Access token, store, expiry, and optional label. Sealed values are bearer credentials. The wrapper requires the proxy route and rejects raw tokens when that route is configured.

Admin issuance uses [OpenSSH SSHSIG](https://raw.githubusercontent.com/openssh/openssh-portable/master/PROTOCOL.sshsig) with the uploaded P-256 key. The signature binds the exact JSON body to `POST /seal`, the configured HTTPS origin, and an expiry within 60 seconds. Identical retries within that window are allowed; there is no single-use claim or replay database. Employee CLI requests carry only the sealed credential.

Anyone with a raw Shopify token and the server's public key can seal locally. The admin signature controls the hosted sealing endpoint; it does not attest who minted a blob. The proxy restricts Shopify operations rather than enforcing membership in an employee list.

Theme-scoped operations require a fresh Shopify role check. Failed or non-development role checks deny the operation. The GraphQL policy under `worker/src/` limits creation and listings to development themes and rejects publishing, duplication, and operations outside the allowlist. Storefront previews are subject to the same development-role check.

In the pinned Shopify CLI, `shptka_` selects Theme Access mode. `SHOPIFY_CLI_THEME_KIT_ACCESS_DOMAIN` routes Admin GraphQL to `/cli/admin/api/<version>/graphql.json` and storefront rendering to `/cli/sfr`, carrying `X-Shopify-Shop` and `X-Shopify-Access-Token`. Keep the sealed format within the CLI's `shptka_\w*` log redaction. Re-verify these integration points against the bundled distribution on CLI upgrades.

## Expiry, rotation, and trust

Renew through the same admin command. There is no individual early revocation. Rotating the underlying Theme Access token invalidates every blob containing it. Replacing the server decryption key invalidates every blob sealed to that key. Replacing the admin public key affects new issuance only.

Removing someone from GitHub or 1Password does not invalidate a credential they already copied. Migrating from a KV-backed deployment drops its per-token revocations; replace the decryption key and reissue credentials if those denials must remain effective.

The Worker operator can decrypt every token it receives. Self-hosting keeps that trust with your own operator. A stolen sealed token can create, edit, or delete development themes on its bound store until expiry: preview-link phishing and dev-theme slot exhaustion remain possible.

Tests under `worker/test/` cover policy, credentials, independent OpenSSH signatures, and admin conversion with a fake secret source and upstream. Before production use, verify real development-theme sync, live reload, a password-protected storefront, denied live-theme operations, and actionable CLI errors. Confirm the pinned CLI does not require an unfiltered theme listing.
