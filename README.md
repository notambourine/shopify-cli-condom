# shopify-cli-condom

Let developers and coding agents work on a Shopify theme with real store data,
without handing them a route to the live theme.

You get one command: `dev`. Local preview and live reload work as usual. Theme
IDs, live-theme access, `publish`, `push`, environments, and arbitrary CLI
arguments do not get through.

Want the raw Shopify token off development machines too? The NoTambourine proxy
swaps it for a sealed, expiring token that only works on development themes.

## Start developing

Node.js 24 or newer is required. Install with lifecycle scripts disabled:

```sh
npm install --ignore-scripts --save-dev @notambourine/shopify-cli-condom
```

Add the development command:

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

The theme needs `layout/` and `templates/`. `shopify-cli-condom --help` lists
the supported development options.

## What the wrapper changes

- Only `dev` exists. The wrapper builds the Shopify CLI arguments itself.
- Every run gets a fresh development theme and its own Shopify CLI storage.
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

The optional proxy narrows a sealed token to development-theme operations. A
stolen sealed token can still create, edit, and delete development themes on its
store until it expires. Tokens cannot be revoked one at a time; rotate the Theme
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

Shopify references: [theme dev](https://shopify.dev/docs/api/shopify-cli/theme/theme-dev)
and [environment precedence](https://shopify.dev/docs/storefronts/themes/tools/cli/environments).

---

Senior engineers. No tambourine. Open source by [NoTambourine](https://notambourine.com).
