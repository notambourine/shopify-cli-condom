# shopify-cli-condom

Let developers and coding agents work on a Shopify theme with real store data,
without handing them a way to change the live theme.

You get two commands. `dev` runs on a fresh development theme with local
preview and live reload. `pull` downloads any theme, the live one included, into
your working tree. `publish`, `push`, environments, and arbitrary CLI arguments
do not get through.

Want the raw Shopify token off development machines too? The NoTambourine proxy
swaps it for a sealed, expiring token that reads any theme and writes only to
development themes.

## Start developing

Node.js 24 or newer is required. Install with lifecycle scripts disabled:

```sh
npm install --ignore-scripts --save-dev @notambourine/shopify-cli-condom
```

Add the development command:

```json
{
  "scripts": {
    "dev": "shopify-cli-condom dev --store your-store",
    "pull": "shopify-cli-condom pull --store your-store --live"
  }
}
```

Provide `SHOPIFY_CLI_THEME_TOKEN` through a secret manager, then run:

```sh
npm run dev
```

`dev` needs `layout/` and `templates/`. `pull` takes `--live` or `--theme ID`
and creates missing theme directories. `shopify-cli-condom --help` lists the
supported options.

## What the wrapper changes

- Only `dev` and `pull` exist. The wrapper builds the Shopify CLI arguments itself.
- Every `dev` run gets a fresh development theme. Every run gets its own Shopify
  CLI storage.
- `pull` overwrites changed files in your working tree and deletes local theme
  files missing from the remote theme unless you pass `--nodelete`.
- Repository environments and cached theme IDs have no say in the command.
- Shopify flags, plugin paths, `NODE_OPTIONS`, and unrelated credentials stay
  out of the child environment.
- An exact Shopify CLI version is bundled, and its `shopify` binary is not
  exposed to the theme project.
- A separate Shopify CLI on `PATH` gets a bypass warning.

Edits still land in your working tree. Restart after adding a top-level theme
directory that did not exist when the command started. The theme's
`.shopifyignore` applies; ignore lists from TOML environments do not. Proxy
environment variables are unsupported.

Normal exits and handled signals clean up the temporary directory. `SIGKILL`
can leave it behind. Cleanup never touches source theme files.

## Know the boundary

The wrapper limits this command, not a raw Theme Access token. That token can
still reach the live theme through another Shopify CLI, a direct API request, or
any HTTP client. Keep production tokens in CI-only secrets where you can, use
staging-store tokens on development machines, and keep deployment approvals in
place.

The package does not install agent command guards.

The optional proxy lets a sealed token read any theme and write only to
development themes. A stolen sealed token can still read every theme and create,
edit, and delete development themes on its store until it expires. Tokens cannot be revoked one at a time; rotate the Theme
Access token or the server decryption key to invalidate them all.

See [proxy operations](https://github.com/notambourine/shopify-cli-condom/blob/main/worker/README.md)
to host the Worker and issue sealed credentials.

## Development

```sh
npm ci --ignore-scripts
npm test

cd worker
npm ci --ignore-scripts
npm test
```

Root tests cover command rejection, environment and config isolation, temporary
themes, and the installed binary shape, all without contacting Shopify. Worker
tests cover sealing, the GraphQL allowlist, previews, and fake upstream
requests.

Shopify references: [theme dev](https://shopify.dev/docs/api/shopify-cli/theme/theme-dev),
[theme pull](https://shopify.dev/docs/api/shopify-cli/theme/theme-pull), and [environment precedence](https://shopify.dev/docs/storefronts/themes/tools/cli/environments).

---

Senior engineers. No tambourine. Open source by [NoTambourine](https://notambourine.com).
