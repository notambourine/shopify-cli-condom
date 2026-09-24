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
    .setup { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
    .setup h3 { margin: 0; }
    .setup > div > p { margin: 12px 0 0; color: var(--fg3); font-size: 14px; }
    ol { margin: 24px 0 0; padding: 0; list-style: none; counter-reset: step; }
    ol li { counter-increment: step; margin-top: 28px; font-size: 14px; }
    ol li::before { content: counter(step, decimal-leading-zero) "  "; color: var(--support-fg); font-weight: 700; }
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
      .grid, .setup, .boundary { grid-template-columns: 1fr; }
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
      <p class="eyebrow">Shopify theme safety</p>
      <h1>Let agents build. Keep <em>production</em> out of reach.</h1>
      <p class="lede">Develop Shopify themes against a real store without giving agents, interns, or routine commands a path to the live theme.</p>
      <div class="actions">
        <a class="button" href="#setup">Set it up</a>
        <a class="text-link" href="#boundary">What it does not protect</a>
      </div>
    </header>
    <section aria-labelledby="problem">
      <div class="section-heading">
        <p class="eyebrow">The problem</p>
        <h2 id="problem">One theme token can change the live store.</h2>
        <p>Shopify has no way to give someone theme development access without also giving them the live theme. The token a contractor, intern, or coding agent uses for <code>theme dev</code> can also push over or publish the storefront your customers see.</p>
        <p>One wrong theme ID, a stale config file, or an agent that decides to "just deploy it" is enough. Instructions in <code>AGENTS.md</code> ask nicely. They do not stop anything.</p>
      </div>
    </section>
    <section aria-labelledby="works">
      <div class="section-heading">
        <p class="eyebrow">How it helps</p>
        <h2 id="works">Keep the dev loop. Remove the ways to ship.</h2>
        <p>Developers still run a local preview with hot reload against real store data. The paths to production are gone.</p>
      </div>
      <div class="grid">
        <article class="card">
          <span class="number">01</span>
          <h3>A command that only develops</h3>
          <p>The wrapper runs <code>dev</code> on a fresh development theme. Theme IDs, live-theme access, <code>push</code>, <code>publish</code>, environments, and extra CLI arguments are rejected.</p>
        </article>
        <article class="card">
          <span class="number">02</span>
          <h3>A token that is not the real one</h3>
          <p>Developers get a sealed, expiring token. The raw Shopify credential stays with the admin and never lands on a laptop or in an agent's environment.</p>
        </article>
        <article class="card">
          <span class="number">03</span>
          <h3>A proxy that checks every call</h3>
          <p>The proxy forwards only development-theme operations and rechecks the theme's role before every write and preview. Anything aimed at the live theme is refused.</p>
        </article>
      </div>
    </section>
    <section id="setup" aria-labelledby="setup-heading">
      <div class="section-heading">
        <p class="eyebrow">Setup</p>
        <h2 id="setup-heading">An admin issues a token. Developers run one script.</h2>
      </div>
      <div class="setup">
        <div>
          <h3>Developers</h3>
          <p>In the theme project, with Node.js 24 or newer.</p>
          <ol>
            <li>Install the wrapper.
<pre><code>npm install --save-dev @notambourine/shopify-cli-condom</code></pre>
            </li>
            <li>Add a script.
<pre><code>{
  "scripts": {
    "dev": "shopify-cli-condom dev --store your-store"
  }
}</code></pre>
            </li>
            <li>Set the sealed token from your admin through a secret manager.
<pre><code>SHOPIFY_CLI_CONDOM_PROXY=${host}
SHOPIFY_CLI_THEME_TOKEN=shptka_sealed_...</code></pre>
            </li>
            <li>Develop.
<pre><code>npm run dev</code></pre>
            </li>
          </ol>
        </div>
        <div>
          <h3>Admins</h3>
          <p>Seal the store's Theme Access token for each person, signed with your SSH key.</p>
          <ol>
            <li>From the repository's <code>worker/</code> directory:
<pre><code>npm run -s issue -- \\
  --secret 'op://Shopify/store/Theme Access token' \\
  --key ~/.ssh/admin.pub \\
  --store your-store \\
  --label employee</code></pre>
            </li>
            <li>Send the printed token through a trusted channel. Reissue it when it expires.</li>
          </ol>
          <p>To run your own proxy or seal tokens locally, follow the <a href="https://github.com/notambourine/shopify-cli-condom#host-the-proxy">self-hosting guide</a>.</p>
        </div>
      </div>
    </section>
    <section class="boundary" id="boundary" aria-labelledby="boundary-heading">
      <div>
        <p class="eyebrow">Limits</p>
        <h2 id="boundary-heading">Prevents accidents, not theft.</h2>
        <p>A raw production token is still full store access through any other tool. Keep it in CI or behind the proxy, and keep your deployment approvals.</p>
      </div>
      <div class="callout">
        <p><strong>Development only.</strong> The wrapper and proxy refuse live-theme operations by design.</p>
        <p>A stolen sealed token can still create, edit, and delete development themes on its store until it expires. Rotating the Theme Access token revokes every sealed token at once.</p>
      </div>
    </section>
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
