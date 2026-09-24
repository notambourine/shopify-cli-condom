import { brandFavicon, brandMark, brandVariables } from './brand.generated.ts';

const render = (host: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Let agents and interns develop Shopify themes against a real store without giving routine tooling a path to the live theme.">
  <title>shopify-cli-condom - development without production access</title>
  <link rel="icon" type="image/svg+xml" href="${brandFavicon}">
  <style>
    ${brandVariables}
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--fg2);
      font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
      font-size: 16px;
      line-height: 1.7;
      letter-spacing: 0.01em;
    }
    a { color: inherit; }
    nav, main, footer { width: min(720px, calc(100% - 48px)); margin: 0 auto; }
    nav { height: 80px; display: flex; align-items: center; justify-content: space-between; }
    .brand { display: flex; align-items: center; gap: 12px; color: var(--fg1); text-decoration: none; font-size: 13px; font-weight: 700; }
    .brand svg { width: 34px; height: 34px; fill: var(--accent); }
    .source { color: var(--fg3); font-size: 13px; text-underline-offset: 4px; }
    .source:hover, .source:focus-visible { color: var(--fg1); }
    :focus-visible { outline: 3px solid var(--support); outline-offset: 4px; }
    h1 { margin: 64px 0 0; color: var(--fg1); font-family: system-ui, sans-serif; font-size: clamp(2.25rem, 6vw, 3.5rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; }
    h1 em { color: var(--accent); font-style: italic; }
    .lede { margin: 24px 0 0; font-size: clamp(1.05rem, 2vw, 1.2rem); }
    h2 { margin: 0; color: var(--fg3); font-family: inherit; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
    .step { margin-top: 56px; }
    pre { overflow-x: auto; margin: 16px 0 0; padding: 20px; background: var(--bg-card); border: 1px solid var(--line); border-radius: var(--r-md); color: var(--fg2); font-size: 13px; line-height: 1.6; }
    code { font-family: inherit; }
    .note { margin: 56px 0 0; padding: 24px; background: var(--accent-soft); border: 1px solid var(--accent); border-radius: var(--r-md); color: var(--fg1); font-size: 14px; }
    footer { display: flex; justify-content: space-between; gap: 24px; padding: 64px 0 56px; color: var(--fg3); font-size: 12px; }
    footer strong { color: var(--fg2); }
    @media (max-width: 760px) {
      nav, main, footer { width: min(100% - 32px, 720px); }
      h1 { margin-top: 40px; }
      footer { flex-direction: column; }
    }
  </style>
</head>
<body>
  <nav aria-label="Primary">
    <a class="brand" href="/">${brandMark}<span>shopify-cli-condom</span></a>
    <a class="source" href="https://github.com/notambourine/shopify-cli-condom">View source</a>
  </nav>
  <main>
    <h1>Let agents build. Keep <em>production</em> out of reach.</h1>
    <p class="lede">Develop Shopify themes against a real store without giving agents, interns, or routine commands a path to the live theme.</p>
    <section class="step">
      <h2>Add the script</h2>
<pre><code>{
  "scripts": {
    "dev": "shopify-cli-condom dev --store your-store"
  }
}</code></pre>
    </section>
    <section class="step">
      <h2>Point at the proxy</h2>
<pre><code>SHOPIFY_CLI_CONDOM_PROXY=${host}
SHOPIFY_CLI_THEME_TOKEN=shptka_sealed_...</code></pre>
    </section>
    <section class="step">
      <h2>Develop</h2>
<pre><code>npm run dev</code></pre>
    </section>
    <p class="note">Every run allocates a development theme. Theme IDs, environments, <code>push</code>, and <code>publish</code> are rejected. A stolen sealed token still edits development themes until it expires.</p>
  </main>
  <footer>
    <strong>Senior engineers. No tambourine.</strong>
    <span>Open source by NoTambourine</span>
  </footer>
</body>
</html>`;

let cached: { host: string; page: string } | undefined;

export function landing(method: string, host: string): Response {
  if (cached?.host !== host) cached = { host, page: render(host) };
  return new Response(method === 'HEAD' ? null : cached.page, {
    headers: {
      'cache-control': 'public, max-age=300',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      'content-type': 'text/html; charset=utf-8',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
    },
  });
}
