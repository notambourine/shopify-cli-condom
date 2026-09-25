import { brandFavicon, brandMark, brandVariables, ogImage } from './brand.generated.ts';

const render = (host: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Sealed Shopify theme tokens for developers and AI agents. Pull the live theme; never change it.">
  <title>shopify-cli-condom proxy - sealed Shopify theme tokens</title>
  <link rel="icon" type="image/svg+xml" href="${brandFavicon}">
  <link rel="canonical" href="https://${host}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="NoTambourine">
  <meta property="og:url" content="https://${host}/">
  <meta property="og:title" content="shopify-cli-condom proxy - sealed Shopify theme tokens">
  <meta property="og:description" content="Sealed Shopify theme tokens for developers and AI agents. Pull the live theme; never change it.">
  <meta property="og:image" content="https://${host}/og.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="shopify-cli-condom proxy: sealed Shopify theme tokens.">
  <meta name="twitter:card" content="summary_large_image">
  <style>
    ${brandVariables}
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
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
    nav, main, footer { width: min(1120px, calc(100% - 48px)); margin: 0 auto; }
    nav { height: 80px; display: flex; align-items: center; justify-content: space-between; }
    .brand { display: flex; align-items: center; gap: 12px; color: var(--fg1); text-decoration: none; font-size: 13px; font-weight: 700; }
    .brand svg { width: 34px; height: 34px; fill: var(--accent); }
    .source { color: var(--fg3); font-size: 13px; text-underline-offset: 4px; }
    .source:hover, .source:focus-visible { color: var(--fg1); }
    :focus-visible { outline: 3px solid var(--support); outline-offset: 4px; }
    .hero { padding: 96px 0 88px; max-width: 900px; }
    .eyebrow { margin: 0 0 20px; color: var(--accent-fg); font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
    h1, h2, h3 { margin: 0; color: var(--fg1); font-family: system-ui, sans-serif; letter-spacing: -0.03em; line-height: 1.05; }
    h1 { font-size: clamp(2.75rem, 7vw, 5.5rem); font-weight: 800; }
    h1 em { color: var(--accent); font-style: italic; }
    .lede { max-width: 720px; margin: 32px 0 0; font-size: clamp(1.05rem, 2vw, 1.3rem); }
    .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 24px; margin-top: 36px; }
    .button { display: inline-flex; align-items: center; min-height: 48px; padding: 10px 24px; border-radius: var(--r-pill); background: var(--accent); color: var(--fg-on-pink); font-size: 14px; font-weight: 700; text-decoration: none; box-shadow: var(--shadow-accent); }
    .button:hover { box-shadow: var(--shadow-pink); }
    .text-link { color: var(--fg3); font-size: 14px; text-underline-offset: 4px; }
    .text-link:hover, .text-link:focus-visible { color: var(--fg1); }
    section { padding: 88px 0; border-top: 1px solid var(--line); }
    .section-heading { max-width: 720px; margin-bottom: 40px; }
    h2 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; }
    .section-heading p { margin: 20px 0 0; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .card { padding: 28px; background: var(--bg-card); border: 1px solid var(--line); border-radius: var(--r-md); }
    .number { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: var(--r-pill); background: var(--support-soft); color: var(--support-fg); font-size: 12px; font-weight: 700; }
    h3 { margin-top: 40px; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .card p { margin: 16px 0 0; color: var(--fg3); font-size: 14px; }
    pre { overflow-x: auto; margin: 12px 0 0; padding: 20px; background: var(--bg-card); border: 1px solid var(--line); border-radius: var(--r-md); color: var(--fg2); font-size: 13px; line-height: 1.6; }
    code { font-family: inherit; }
    .boundary { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }
    .boundary p { margin: 24px 0 0; }
    .callout { padding: 28px; background: var(--accent-soft); border: 1px solid var(--accent); border-radius: var(--r-md); color: var(--fg1); font-size: 14px; }
    .callout p { margin: 16px 0 0; }
    .callout p:first-child { margin: 0; }
    footer { display: flex; justify-content: space-between; gap: 24px; padding: 44px 0 56px; border-top: 1px solid var(--line); color: var(--fg3); font-size: 12px; }
    footer strong { color: var(--fg2); }
    @media (max-width: 860px) {
      nav, main, footer { width: min(100% - 32px, 1120px); }
      .hero { padding: 56px 0 72px; }
      section { padding: 64px 0; }
      .grid, .boundary { grid-template-columns: 1fr; }
      .boundary { gap: 32px; }
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
    <header class="hero">
      <p class="eyebrow">Hosted Shopify theme proxy</p>
      <h1>Hand out store access, <em>not the live theme</em>.</h1>
      <p class="lede">We keep your Theme Access token. Developers and agents get a sealed, expiring copy: pull any theme, change only development themes.</p>
      <div class="actions">
        <a class="button" href="#setup">Connect a project</a>
        <a class="text-link" href="#boundary">What it does not protect</a>
      </div>
    </header>
    <section aria-labelledby="problem">
      <div class="section-heading">
        <p class="eyebrow">Why it exists</p>
        <h2 id="problem">Shopify theme tokens do not stop at development.</h2>
        <p>A token that runs <code>theme dev</code> can also publish over the live storefront. Shopify has no development-only scope.</p>
      </div>
    </section>
    <section aria-labelledby="works">
      <div class="section-heading">
        <p class="eyebrow">How it works</p>
        <h2 id="works">The real token never leaves the proxy.</h2>
      </div>
      <div class="grid">
        <article class="card">
          <span class="number">01</span>
          <h3>Sealed</h3>
          <p>Bound to one store with an expiry. Developers only hold the sealed copy.</p>
        </article>
        <article class="card">
          <span class="number">02</span>
          <h3>Checked</h3>
          <p>Only <code>theme dev</code> and <code>theme pull</code> get through. Reads reach any theme; writes reach development themes only.</p>
        </article>
        <article class="card">
          <span class="number">03</span>
          <h3>Revocable</h3>
          <p>Tokens expire on their own. Rotate the Theme Access token to revoke them all.</p>
        </article>
      </div>
    </section>
    <section id="setup" aria-labelledby="setup-heading">
      <div class="section-heading">
        <p class="eyebrow">Setup</p>
        <h2 id="setup-heading">Point shopify-cli-condom at this proxy.</h2>
        <p>Load the sealed token from a secret manager.</p>
<pre><code>SHOPIFY_CLI_CONDOM_PROXY=${host}
SHOPIFY_CLI_THEME_TOKEN=shptka_sealed_...</code></pre>
        <p>Install the wrapper from the <a href="https://github.com/notambourine/shopify-cli-condom">README</a>.</p>
      </div>
    </section>
    <section class="boundary" id="boundary" aria-labelledby="boundary-heading">
      <p class="eyebrow" id="boundary-heading">Limits</p>
      <div class="callout">
        <p><strong>Read-only on live.</strong> Every live-theme write is refused.</p>
        <p>A stolen sealed token can still read every theme and create, edit, or delete development themes until it expires.</p>
      </div>
    </section>
  </main>
  <footer>
    <strong>Senior engineers. No tambourine.</strong>
    <span>Made with &lt;3 by NoTambourine. In daily use keeping Claude off client live themes at 50 deploys a day (Q3 average).</span>
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

const ogBytes = Uint8Array.from(atob(ogImage), (c) => c.charCodeAt(0));

export function og(method: string): Response {
  return new Response(method === 'HEAD' ? null : ogBytes, {
    headers: {
      'cache-control': 'public, max-age=86400',
      'content-type': 'image/png',
      'x-content-type-options': 'nosniff',
    },
  });
}
