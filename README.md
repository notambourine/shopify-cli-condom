# shopify-cli-condom

Give developers and coding agents real store data without the keys to the live
theme.

The wrapper runs two Shopify CLI commands. `dev` creates a fresh development
theme with local preview and live reload. `pull` downloads any theme, including
the live one, into your working tree. It rejects `publish`, `push`,
environments, and any other CLI arguments.

The optional NoTambourine proxy keeps the Theme Access token off development
machines. Developers get a sealed token that expires. It can read any theme and
write only to development themes.

## Install

You need Node.js 24 or newer. Install with lifecycle scripts disabled:

```sh
npm install --ignore-scripts --save-dev @notambourine/shopify-cli-condom
```

Add scripts for your store:

```json
{
  "scripts": {
    "dev": "shopify-cli-condom dev --store your-store",
    "pull": "shopify-cli-condom pull --store your-store --live"
  }
}
```

Load `SHOPIFY_CLI_THEME_TOKEN` from a secret manager and run `npm run dev`.

`dev` needs `layout/` and `templates/` in the theme. `pull` takes `--live` or
`--theme ID` and creates any theme directories you are missing. Run
`shopify-cli-condom --help` for every option.

## What the wrapper does

The wrapper parses your options and builds the Shopify CLI arguments itself.
Each `dev` run gets a new development theme, and every run gets its own Shopify
CLI storage. It ignores repository environments and cached theme IDs.

The child process starts from an allowlisted environment. Shopify flags, plugin
paths, `NODE_OPTIONS`, and unrelated credentials stay out. The package bundles
one exact Shopify CLI version and does not put its `shopify` binary on your
project's path. If it finds another Shopify CLI on `PATH`, it warns you that the
other CLI bypasses the wrapper.

`pull` overwrites changed files in your working tree. It also deletes local
theme files that the remote theme lacks, unless you pass `--nodelete`.

Edits from `dev` land in your working tree. If you add a top-level theme
directory while the command runs, restart it. The theme's `.shopifyignore`
applies; ignore lists in TOML environments do not. HTTP proxy variables such
as `HTTPS_PROXY` do not reach Shopify CLI.

The wrapper removes its temporary directory on normal exit and on handled
signals. `SIGKILL` can leave it behind. Cleanup never touches your theme files.

## Limits

The wrapper constrains only its own commands. It does not constrain a raw Theme
Access token, which can still change the live theme through another Shopify CLI, a
direct API call, or any HTTP client. Where you can, keep production tokens in
CI-only secrets, give development machines staging-store tokens, and keep
deployment approvals in place.

Nothing in the package stops an agent from running another Shopify CLI. Add
your own agent command guards.

The proxy constrains a sealed token: it reads any theme and writes only to
development themes. A stolen sealed token can still read every theme and
create, edit, and delete development themes on its store until it expires. You
cannot revoke a single token. Rotating the Theme Access token or the server's
private key invalidates all of them.

To host the proxy and issue sealed tokens, see
[proxy operations](https://github.com/notambourine/shopify-cli-condom/blob/main/worker/README.md).

## Development

```sh
npm ci --ignore-scripts
npm test

cd worker
npm ci --ignore-scripts
npm test
```

Root tests cover rejected commands, environment and config isolation, temporary
themes, and the installed binary layout. None of them contact Shopify. Worker
tests cover sealing, the GraphQL allowlist, previews, and requests to a fake
upstream.

Shopify docs: [theme dev](https://shopify.dev/docs/api/shopify-cli/theme/theme-dev),
[theme pull](https://shopify.dev/docs/api/shopify-cli/theme/theme-pull), and
[environment precedence](https://shopify.dev/docs/storefronts/themes/tools/cli/environments).

---

Made with 💙 by [NoTambourine](https://notambourine.com).
