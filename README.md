# shopify-cli-condom

Develop a Shopify theme against real store data without giving the development
command a route to the live theme.

`shopify-cli-condom` replaces general Shopify CLI access with one constrained
`dev` command. Developers and coding agents keep local preview and live reload.
The wrapper rejects theme IDs, live-theme access, publishing, pushing,
environments, and arbitrary CLI arguments.

For teams that also need to keep the raw Shopify credential out of the
development environment, the included proxy exchanges it for a sealed,
expiring credential and allows only development-theme operations.

## Start developing

Node.js 24 or newer is required. Install a locally packed tarball with lifecycle
scripts disabled:

```sh
npm install --ignore-scripts --save-dev /path/to/shopify-cli-condom.tgz
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

The theme needs `layout/` and `templates/`. Run
`shopify-cli-condom --help` for the supported development options.

## What the wrapper changes

- Only `dev` is available. The wrapper builds the Shopify CLI arguments itself.
- Every run gets a new development theme and isolated Shopify CLI storage.
- Repository environments and cached theme IDs cannot affect the command.
- Shopify flags, plugin paths, `NODE_OPTIONS`, and unrelated credentials are
  removed from the child environment.
- The package bundles an exact Shopify CLI version without exposing its
  `shopify` binary to the theme project.
- A separate Shopify CLI on `PATH` produces a bypass warning.

Edits still happen in the working tree. Restart after adding a top-level theme
directory that was not present when the command started. The theme's
`.shopifyignore` applies; ignore lists from TOML environments do not. Proxy
environment variables are unsupported.

Normal exits and handled signals remove the temporary directory. `SIGKILL` can
leave it behind. Cleanup never removes source theme files.

## Know the boundary

The wrapper limits this command. It does not limit a raw Theme Access token.
That token can still reach the live theme through another Shopify CLI, a direct
API request, or any HTTP client. Keep production tokens in CI-only secrets when
possible, use staging-store tokens on development machines, and keep deployment
approvals in place.

The package does not install agent command guards.

The optional proxy narrows a sealed credential to development-theme operations.
A stolen sealed credential can still create, edit, and delete development
themes on its bound store until it expires. Credentials cannot be revoked one
at a time. Rotate the Theme Access token or server decryption key to invalidate
them.

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

The root tests cover command rejection, environment and config isolation,
temporary themes, and the installed binary shape without contacting Shopify.
The Worker tests cover sealing, the GraphQL allowlist, previews, and fake
upstream requests.

Shopify references: [theme dev](https://shopify.dev/docs/api/shopify-cli/theme/theme-dev)
and [environment precedence](https://shopify.dev/docs/storefronts/themes/tools/cli/environments).
