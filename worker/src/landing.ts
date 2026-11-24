import { brandFavicon, brandLockup, brandStyles, ogImage } from './brand.generated.ts';

const title = 'shopify-cli-condom proxy: let AI agents run theme dev on your real store';
const description = 'Give an agent a sealed token that reads any theme and writes only to development themes. The proxy refuses every write to your live theme.';

const render = (host: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${description}">
  <title>${title}</title>
  <link rel="icon" type="image/svg+xml" href="${brandFavicon}">
  <link rel="canonical" href="https://${host}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="NoTambourine">
  <meta property="og:url" content="https://${host}/">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="https://${host}/og.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Practice safe theme development. ${description}">
  <meta name="twitter:card" content="summary_large_image">
  <style>
    ${brandStyles}
    * { box-sizing: border-box; }
    body { margin: 0; }
    .nt-measure { margin-inline: 0; }
    .flow { --gate: 184px; --lead: var(--sp-10); max-width: 880px; margin: 0; font-size: var(--fs-body); line-height: var(--lh-tight); color: var(--fg2); }
    .flow ol { list-style: none; margin: 0; padding: 0; }
    .flow__row { display: grid; grid-template-columns: minmax(0, 1fr) var(--gate) minmax(0, 1fr); }
    .flow__row > * { display: flex; align-items: center; min-width: 0; padding-block: var(--sp-4); }
    .flow__head > * { flex-direction: column; align-items: flex-start; gap: var(--sp-1); }
    .flow__head > .flow__gate { align-items: center; text-align: center; padding-inline: var(--sp-2); border-top: 1px solid var(--line); border-radius: var(--r-md) var(--r-md) 0 0; }
    .flow__head b { font-family: var(--font-accent); font-weight: var(--fw-semibold); color: var(--fg1); }
    .flow__head small { font-size: var(--fs-caption); color: var(--fg3); }
    .flow__gate { background: var(--bg-card); border-inline: 1px solid var(--line); }
    .flow li:last-child > * { padding-bottom: var(--sp-6); }
    .flow li:last-child .flow__gate { border-bottom: 1px solid var(--line); border-radius: 0 0 var(--r-md) var(--r-md); }
    .flow__head > :last-child { padding-left: calc(var(--lead) + var(--sp-3)); }
    .flow__req { gap: var(--sp-3); }
    .flow__req::after, .flow li .flow__gate::before, .flow li .flow__gate::after, .flow__row--ok .flow__dest::before { content: ''; flex: 1 0 var(--sp-3); border-top: 2px solid var(--support); }
    .flow__row--ok .flow__dest::before { flex: 0 0 var(--lead); }
    .flow li.flow__row--no .flow__req::after, .flow li.flow__row--no .flow__gate::before { border-top: 2px dashed var(--line-control); }
    .flow li.flow__row--no .flow__gate::after { border-color: transparent; }
    .flow__mark { flex: none; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--support); color: var(--support-fg); }
    .flow__row--no .flow__mark { border-color: var(--line-control); color: var(--fg2); }
    .flow__tip { flex: none; margin-left: -7px; color: var(--support); }
    .flow__dest > span { margin-left: var(--sp-3); color: var(--fg1); }
    .flow__row--no .flow__dest > span { margin-left: calc(var(--lead) + var(--sp-3)); color: var(--fg3); }
    .flow__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    @media (max-width: 640px) { .flow { --gate: 76px; --lead: var(--sp-3); font-size: var(--fs-caption); } .flow__req { gap: var(--sp-2); } }
    pre { overflow-x: auto; margin: 0; padding: var(--sp-5); background: var(--bg-card); border: 1px solid var(--line); border-radius: var(--r-md); color: var(--fg1); }
  </style>
</head>
<body>
  <a class="nt-skip" href="#main">Skip to content</a>
  <header class="nt-header">
    <a href="https://notambourine.com" class="nt-brand" aria-label="NoTambourine home"><img src="${brandLockup}" alt=""></a>
    <span class="nt-nav-note">shopify-cli-condom</span>
    <nav class="nt-header__links" aria-label="Primary">
      <a href="#setup">Setup</a>
      <a href="#limits">Limits</a>
      <a href="https://github.com/notambourine/shopify-cli-condom">Source</a>
    </nav>
    <a class="nt-header__cta nt-btn nt-btn--secondary nt-btn--sm" href="https://notambourine.com/tom">Start a conversation</a>
  </header>
  <main id="main">
    <section class="nt-section nt-stack" style="--gap: var(--sp-8); border-top: 0">
      <div class="nt-stack" style="--gap: var(--sp-5)">
        <p class="eyebrow">Theme development for AI agents</p>
        <h1 class="display">Practice <em>safe</em> theme development.</h1>
      </div>
      <p class="lede nt-measure">Let an AI agent run <code>theme dev</code> against your real store data, unattended. It works with a sealed token that expires, reads any theme, and writes only to development themes. Your Theme Access token stays on the proxy.</p>
      <div class="nt-cluster" style="--gap: var(--sp-4)">
        <a class="nt-btn nt-btn--primary nt-btn--lg" href="#setup">Connect an agent</a>
        <a class="nt-btn nt-btn--ghost nt-btn--lg" href="#limits">Read the limits</a>
      </div>
    </section>

    <section class="nt-section nt-stack" style="--gap: var(--sp-8)" aria-labelledby="problem">
      <div class="nt-stack nt-measure" style="--gap: var(--sp-5)">
        <p class="eyebrow">Why it exists</p>
        <h2 id="problem">Agents build better themes on <em>real</em> store data.</h2>
        <p>An agent that previews against your real products, sections, and settings can check its own work before you review it. A Theme Access token has no development-only scope, though: anything that can run <code>theme dev</code> with it can also overwrite or publish your live theme. The proxy holds that token and checks every request made with a sealed copy, so you can hand the agent the store and review the result.</p>
      </div>
      <figure class="flow" aria-label="What the proxy does with each request an agent makes">
        <div class="flow__row flow__head" aria-hidden="true">
          <span><b>AI agent</b><small>holds a sealed token</small></span>
          <span class="flow__gate"><b>Proxy</b><small>holds the Theme Access token</small></span>
          <span><b>Your store</b><small>on Shopify</small></span>
        </div>
        <ol>
        <li class="flow__row flow__row--ok">
          <span class="flow__req"><span>Read any theme, including the live one</span></span>
          <span class="flow__gate"><span class="flow__mark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></span>
          <span class="flow__dest"><svg class="flow__tip" width="8" height="12" viewBox="0 0 8 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m1 1 5 5-5 5"/></svg><span><span class="flow__sr">forwarded to </span>Any theme</span></span>
        </li>
        <li class="flow__row flow__row--ok">
          <span class="flow__req"><span>Write to a development theme</span></span>
          <span class="flow__gate"><span class="flow__mark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></span>
          <span class="flow__dest"><svg class="flow__tip" width="8" height="12" viewBox="0 0 8 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m1 1 5 5-5 5"/></svg><span><span class="flow__sr">forwarded to </span>Development themes</span></span>
        </li>
        <li class="flow__row flow__row--no">
          <span class="flow__req"><span>Write to the live theme</span></span>
          <span class="flow__gate"><span class="flow__mark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span></span>
          <span class="flow__dest"><span>Refused</span></span>
        </li>
        <li class="flow__row flow__row--no">
          <span class="flow__req"><span>Publish a theme</span></span>
          <span class="flow__gate"><span class="flow__mark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span></span>
          <span class="flow__dest"><span>Refused</span></span>
        </li>
        <li class="flow__row flow__row--no">
          <span class="flow__req"><span>Any request <code>theme dev</code> and <code>theme pull</code> do not make</span></span>
          <span class="flow__gate"><span class="flow__mark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span></span>
          <span class="flow__dest"><span>Refused</span></span>
        </li>
        </ol>
      </figure>
    </section>

    <section class="nt-section nt-stack" style="--gap: var(--sp-8)" aria-labelledby="works">
      <div class="nt-stack nt-measure" style="--gap: var(--sp-5)">
        <p class="eyebrow">How it works</p>
        <h2 id="works">The agent holds a token that cannot <em>publish</em>.</h2>
      </div>
      <div class="nt-grid">
        <article class="nt-card nt-stack" style="--gap: var(--sp-2)">
          <h3 style="font-size: var(--fs-h4)">Sealed</h3>
          <p>Each sealed token is encrypted to this proxy and bound to one store. Agents and developers never see the Theme Access token inside it.</p>
        </article>
        <article class="nt-card nt-stack" style="--gap: var(--sp-2)">
          <h3 style="font-size: var(--fs-h4)">Checked</h3>
          <p>Before it forwards a write or a preview, the proxy confirms the target is a development theme.</p>
        </article>
        <article class="nt-card nt-stack" style="--gap: var(--sp-2)">
          <h3 style="font-size: var(--fs-h4)">Expiring</h3>
          <p>Every sealed token carries an expiry date. After it, the proxy refuses the token.</p>
        </article>
      </div>
    </section>

    <section class="nt-section" id="setup" aria-labelledby="setup-heading">
      <div class="nt-stack nt-measure" style="--gap: var(--sp-5)">
        <p class="eyebrow">Setup</p>
        <h2 id="setup-heading">Point the agent's wrapper at this <em>proxy</em>.</h2>
        <p>Load both values into the agent's environment from a secret manager:</p>
<pre><code>SHOPIFY_CLI_CONDOM_PROXY=${host}
SHOPIFY_CLI_THEME_TOKEN=shptka_sealed_...</code></pre>
        <p>Install the wrapper from the <a href="https://github.com/notambourine/shopify-cli-condom">README</a>.</p>
      </div>
    </section>

    <section class="nt-section" id="limits" aria-labelledby="limits-heading">
      <div class="nt-stack nt-measure" style="--gap: var(--sp-5)">
        <p class="eyebrow">Limits</p>
        <h2 id="limits-heading">What a sealed token can <em>still</em> do.</h2>
        <div class="nt-card nt-card--accent nt-stack" style="--gap: var(--sp-3)">
          <p>A sealed token, held by your agent or stolen from it, can still read every theme and create, edit, or delete development themes on its store until it expires. It cannot write to the live theme.</p>
          <p>The proxy limits the sealed token only. An agent that also holds the raw Theme Access token can skip the proxy, so keep that token out of its environment.</p>
          <p>You cannot revoke a single token. Rotate the Theme Access token to invalidate every sealed copy.</p>
          <p>Whoever runs this proxy can decrypt every token sent to it. If you cannot extend that trust, <a href="https://github.com/notambourine/shopify-cli-condom/blob/main/worker/README.md">host your own</a>.</p>
        </div>
      </div>
    </section>
  </main>
  <footer class="nt-footer">
    <a href="https://notambourine.com" class="nt-brand" aria-label="NoTambourine home"><img src="${brandLockup}" alt=""></a>
    <nav class="nt-footer__groups" aria-label="Site">
      <div>
        <p class="nt-footer__label">shopify-cli-condom</p>
        <ul>
          <li><a href="https://github.com/notambourine/shopify-cli-condom">Source</a></li>
          <li><a href="https://github.com/notambourine/shopify-cli-condom/blob/main/worker/README.md">Host your own proxy</a></li>
        </ul>
      </div>
      <div>
        <p class="nt-footer__label">NoTambourine</p>
        <ul>
          <li><a href="https://notambourine.com/tom">Start a conversation</a></li>
        </ul>
      </div>
    </nav>
    <p class="nt-footer__legal">NoTambourine · a boutique AI-native engineering agency</p>
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
