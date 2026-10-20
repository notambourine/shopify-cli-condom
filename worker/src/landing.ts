import { brandFavicon, brandLockup, brandMark, brandStyles, ogImage } from './brand.generated.ts';

const render = (host: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Give developers and AI agents a sealed Shopify theme token that reads any theme and writes only to development themes.">
  <title>shopify-cli-condom proxy · sealed Shopify theme tokens</title>
  <link rel="icon" type="image/svg+xml" href="${brandFavicon}">
  <link rel="canonical" href="https://${host}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="NoTambourine">
  <meta property="og:url" content="https://${host}/">
  <meta property="og:title" content="shopify-cli-condom proxy · sealed Shopify theme tokens">
  <meta property="og:description" content="Give developers and AI agents a sealed Shopify theme token that reads any theme and writes only to development themes.">
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
    body { margin: 0; }
    main { width: min(100%, 1100px); margin-inline: auto; }
    main > .nt-section:first-child { border-top: 0; }
    .home { display: inline-flex; align-items: center; gap: var(--sp-3); color: var(--fg1); border: 0; font-family: var(--font-accent); font-size: var(--fs-label); font-weight: var(--fw-bold); }
    .home svg { width: 32px; height: 32px; fill: var(--accent); }
    .nt-measure { margin-inline: 0; }
    .nt-card p, .nt-card li { color: var(--fg2); font-size: var(--fs-small); }
    .nt-card ul { margin: 0; padding-left: var(--sp-5); display: grid; gap: var(--sp-2); }
    pre { overflow-x: auto; margin: 0; padding: var(--sp-5); background: var(--bg-card); border: 1px solid var(--line); border-radius: var(--r-md); color: var(--fg2); line-height: 1.6; }
    pre code { padding: 0; background: none; color: inherit; }
    .nt-footer p { font-size: inherit; color: inherit; }
    .nt-footer strong { color: var(--fg1); }
  </style>
</head>
<body>
  <a class="nt-skip" href="#main">Skip to content</a>
  <header class="nt-header">
    <a class="home" href="/">${brandMark}<span>shopify-cli-condom</span></a>
    <nav class="nt-header__links" aria-label="Primary">
      <a href="#setup">Setup</a>
      <a href="#limits">Limits</a>
      <a href="https://github.com/notambourine/shopify-cli-condom">Source</a>
    </nav>
    <a class="nt-header__cta nt-btn nt-btn--secondary nt-btn--sm" href="https://notambourine.com/tom">Start a conversation</a>
  </header>
  <main id="main">
    <section class="nt-section nt-stack" style="--gap: var(--sp-8)">
      <div class="nt-stack" style="--gap: var(--sp-5)">
        <p class="eyebrow">Shopify theme proxy</p>
        <h1 class="display">Pull the live theme. Change only <em>development</em> themes.</h1>
      </div>
      <p class="lede nt-measure">The proxy holds your Theme Access token. Developers and AI agents get a sealed copy that expires. It reads any theme and writes only to development themes.</p>
      <div class="nt-cluster" style="--gap: var(--sp-4)">
        <a class="nt-btn nt-btn--primary nt-btn--lg" href="#setup">Connect a project</a>
        <a class="nt-btn nt-btn--ghost nt-btn--lg" href="#limits">Read the limits</a>
      </div>
    </section>

    <section class="nt-section nt-stack" style="--gap: var(--sp-8)" aria-labelledby="problem">
      <div class="nt-stack nt-measure" style="--gap: var(--sp-5)">
        <p class="eyebrow">Why it exists</p>
        <h2 id="problem">Shopify has no <em>development-only</em> token.</h2>
        <p>A token that can run <code>theme dev</code> can also publish over your live storefront. The proxy keeps that token and checks every request made with the sealed copy.</p>
      </div>
      <div class="nt-grid" style="--gap: var(--sp-5)">
        <div class="nt-card nt-card--support nt-stack" style="--gap: var(--sp-4); align-items: start">
          <span class="nt-badge nt-badge--mint"><span class="nt-badge__dot"></span>Forwarded</span>
          <ul>
            <li><code>theme dev</code> and <code>theme pull</code></li>
            <li>Reads of any theme, including live</li>
            <li>Writes to development themes</li>
          </ul>
        </div>
        <div class="nt-card nt-stack" style="--gap: var(--sp-4); align-items: start">
          <span class="nt-badge nt-badge--outline">Refused</span>
          <ul>
            <li>Every write to the live theme</li>
            <li>Publishing a theme</li>
            <li>Any operation <code>theme dev</code> and <code>theme pull</code> do not need</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="nt-section nt-stack" style="--gap: var(--sp-8)" aria-labelledby="works">
      <div class="nt-stack nt-measure" style="--gap: var(--sp-5)">
        <p class="eyebrow">How it works</p>
        <h2 id="works">The real token stays on the <em>proxy</em>.</h2>
      </div>
      <div class="nt-grid">
        <article class="nt-card nt-stack" style="--gap: var(--sp-3)">
          <h3>Sealed</h3>
          <p>Each sealed token is bound to one store. Developers never see the Theme Access token behind it.</p>
        </article>
        <article class="nt-card nt-stack" style="--gap: var(--sp-3)">
          <h3>Checked</h3>
          <p>Before forwarding a write or a preview, the proxy confirms the target is a development theme.</p>
        </article>
        <article class="nt-card nt-stack" style="--gap: var(--sp-3)">
          <h3>Expiring</h3>
          <p>Sealed tokens expire on their own. Rotate the Theme Access token to invalidate all of them at once.</p>
        </article>
      </div>
    </section>

    <section class="nt-section" id="setup" aria-labelledby="setup-heading">
      <div class="nt-stack nt-measure" style="--gap: var(--sp-5)">
        <p class="eyebrow">Setup</p>
        <h2 id="setup-heading">Point the wrapper at this <em>proxy</em>.</h2>
        <p>Load both values from a secret manager:</p>
<pre><code>SHOPIFY_CLI_CONDOM_PROXY=${host}
SHOPIFY_CLI_THEME_TOKEN=shptka_sealed_...</code></pre>
        <p>The <a href="https://github.com/notambourine/shopify-cli-condom">README</a> covers installing the wrapper.</p>
      </div>
    </section>

    <section class="nt-section" id="limits" aria-labelledby="limits-heading">
      <div class="nt-stack nt-measure" style="--gap: var(--sp-5)">
        <p class="eyebrow">Limits</p>
        <h2 id="limits-heading">What a stolen token can <em>still</em> do.</h2>
        <div class="nt-card nt-card--accent nt-stack" style="--gap: var(--sp-3)">
          <p>A stolen sealed token can still read every theme and create, edit, or delete development themes on its store until it expires. It cannot write to the live theme.</p>
          <p>You cannot revoke a single token. Rotate the Theme Access token to invalidate every sealed copy.</p>
        </div>
      </div>
    </section>
  </main>
  <footer class="nt-footer">
    <a href="https://notambourine.com" class="nt-brand" aria-label="NoTambourine home"><img src="${brandLockup}" alt=""></a>
    <p><strong>Engineering measured in results, not hours.</strong> We use this proxy every day to keep Claude off client live themes, averaging 50 deploys a day in Q3.</p>
    <nav class="nt-footer__groups" aria-label="Site">
      <div>
        <p class="nt-footer__label">shopify-cli-condom</p>
        <ul>
          <li><a href="https://github.com/notambourine/shopify-cli-condom">Source</a></li>
          <li><a href="https://github.com/notambourine/shopify-cli-condom/blob/main/worker/README.md">Proxy operations</a></li>
        </ul>
      </div>
      <div>
        <p class="nt-footer__label">NoTambourine</p>
        <ul>
          <li><a href="https://notambourine.com/tom">Start a conversation</a></li>
        </ul>
      </div>
    </nav>
    <p class="nt-footer__legal">Open source by NoTambourine · a boutique AI-native engineering agency.</p>
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
