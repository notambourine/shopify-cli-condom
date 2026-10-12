import { brandFavicon, brandMark, brandStyles, ogImage } from './brand.generated.ts';

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
  <meta property="og:image:alt" content="Develop Shopify themes against real store data. Live reload without live-theme access.">
  <meta name="twitter:card" content="summary_large_image">
  <style>
    ${brandStyles}
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; }
    nav, main, footer { width: min(1120px, calc(100% - var(--sp-12))); margin: 0 auto; }
    nav { height: var(--sp-20); display: flex; align-items: center; justify-content: space-between; }
    nav a, footer a { color: inherit; }
    nav a:hover, footer a:hover { border-bottom-color: currentColor; }
    .brand { display: flex; align-items: center; gap: var(--sp-3); color: var(--fg1); font-family: var(--font-accent); font-size: var(--fs-label); font-weight: var(--fw-bold); }
    nav .brand:hover { border-bottom-color: transparent; }
    .brand svg { width: 34px; height: 34px; fill: var(--accent); }
    .source { color: var(--fg3); font-size: var(--fs-label); }
    .source:hover { color: var(--fg1); }
    .hero { padding: var(--sp-24) 0 88px; max-width: 900px; }
    .eyebrow { margin-bottom: var(--sp-5); }
    .lede { max-width: 640px; margin-top: var(--sp-8); }
    .actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-4); margin-top: 36px; }
    section { padding: 88px 0; border-top: 1px solid var(--line); }
    .section-heading { max-width: 640px; margin-bottom: var(--sp-10); }
    .section-heading p:not(.eyebrow) { margin-top: var(--sp-5); }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-5); }
    .nt-card h3 { margin-top: var(--sp-10); }
    .nt-card p { margin-top: var(--sp-4); color: var(--fg3); font-size: var(--fs-small); }
    pre { overflow-x: auto; margin: var(--sp-3) 0 0; padding: var(--sp-5); background: var(--bg-card); border: 1px solid var(--line); border-radius: var(--r-md); color: var(--fg2); line-height: 1.6; }
    pre code { padding: 0; background: none; color: inherit; }
    .boundary { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-16); align-items: start; }
    .callout p { color: var(--fg1); font-size: var(--fs-small); }
    .callout p + p { margin-top: var(--sp-4); }
    footer { display: flex; justify-content: space-between; gap: var(--sp-6); padding: 44px 0 56px; border-top: 1px solid var(--line); }
    footer p { color: var(--fg3); font-size: var(--fs-caption); }
    footer strong { color: var(--fg2); }
    @media (max-width: 860px) {
      nav, main, footer { width: min(100% - var(--sp-8), 1120px); }
      .hero { padding: 56px 0 72px; }
      section { padding: var(--sp-16) 0; }
      .grid, .boundary { grid-template-columns: 1fr; }
      .boundary { gap: var(--sp-8); }
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
      <h1 class="display">Hand out store access, <em>not the live theme</em>.</h1>
      <p class="lede">We keep your Theme Access token. Developers and agents get a sealed, expiring copy: pull any theme, change only development themes.</p>
      <div class="actions">
        <a class="nt-btn nt-btn--primary nt-btn--lg" href="#setup">Connect a project</a>
        <a class="nt-btn nt-btn--ghost nt-btn--lg" href="#boundary">What it does not protect</a>
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
        <article class="nt-card">
          <span class="nt-badge nt-badge--mint">01</span>
          <h3>Sealed</h3>
          <p>Bound to one store with an expiry. Developers only hold the sealed copy.</p>
        </article>
        <article class="nt-card">
          <span class="nt-badge nt-badge--mint">02</span>
          <h3>Checked</h3>
          <p>Only <code>theme dev</code> and <code>theme pull</code> get through. Reads reach any theme; writes reach development themes only.</p>
        </article>
        <article class="nt-card">
          <span class="nt-badge nt-badge--mint">03</span>
          <h3>Expiring</h3>
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
      <div class="callout nt-card nt-card--accent">
        <p><strong>Read-only on live.</strong> Every live-theme write is refused.</p>
        <p>A stolen sealed token can still read every theme and create, edit, or delete development themes until it expires.</p>
      </div>
    </section>
  </main>
  <footer>
    <p><strong>Engineering you can see in the numbers.</strong></p>
    <p>Open source by NoTambourine · a boutique AI-native engineering agency. In daily use keeping Claude off client live themes at 50 deploys a day (Q3 average). <a href="https://notambourine.com/tom">Start a conversation</a>.</p>
  </footer>
</body>
</html>`;

let cached: { host: string; page: string } | undefined;

export function landing(method: string, host: string): Response {
  if (cached?.host !== host) cached = { host, page: render(host) };
  return new Response(method === 'HEAD' ? null : cached.page, {
    headers: {
      'cache-control': 'public, max-age=300',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
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
