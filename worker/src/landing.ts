import { brandMark, brandVariables } from './brand.generated.ts';

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Let agents and interns develop Shopify themes against a real store without giving routine tooling a path to the live theme.">
  <title>shopify-cli-condom - development without production access</title>
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
    .hero { padding: 112px 0 104px; max-width: 900px; }
    .eyebrow { margin: 0 0 20px; color: var(--accent-fg); font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
    h1, h2, h3 { margin: 0; color: var(--fg1); font-family: system-ui, sans-serif; letter-spacing: -0.03em; line-height: 1.05; }
    h1 { max-width: 880px; font-size: clamp(3rem, 8vw, 6.75rem); font-weight: 800; }
    h1 em { color: var(--accent); font-style: italic; }
    .lede { max-width: 720px; margin: 32px 0 0; font-size: clamp(1.05rem, 2vw, 1.3rem); }
    .actions { display: flex; align-items: center; gap: 24px; margin-top: 36px; }
    .button { display: inline-flex; align-items: center; min-height: 48px; padding: 10px 24px; border-radius: var(--r-pill); background: var(--accent); color: var(--fg-on-pink); font-size: 14px; font-weight: 700; text-decoration: none; box-shadow: var(--shadow-accent); }
    .button:hover { box-shadow: var(--shadow-pink); }
    :focus-visible { outline: 3px solid var(--support); outline-offset: 4px; }
    section { padding: 88px 0; border-top: 1px solid var(--line); }
    .section-heading { max-width: 700px; margin-bottom: 40px; }
    h2 { font-size: clamp(2.25rem, 5vw, 4rem); font-weight: 800; }
    .section-heading p { margin: 20px 0 0; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .card { min-height: 260px; padding: 28px; background: var(--bg-card); border: 1px solid var(--line); border-radius: var(--r-md); }
    .number { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: var(--r-pill); background: var(--support-soft); color: var(--support-fg); font-size: 12px; font-weight: 700; }
    h3 { margin-top: 52px; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
    .card p { margin: 16px 0 0; color: var(--fg3); font-size: 14px; }
    .boundary { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }
    .boundary p { max-width: 640px; margin: 24px 0 0; }
    .callout { padding: 28px; background: var(--accent-soft); border: 1px solid var(--accent); border-radius: var(--r-md); color: var(--fg1); font-size: 14px; }
    footer { display: flex; justify-content: space-between; gap: 24px; padding: 44px 0 56px; color: var(--fg3); font-size: 12px; }
    footer strong { color: var(--fg2); }
    @media (max-width: 760px) {
      nav, main, footer { width: min(100% - 32px, 1120px); }
      .hero { padding: 72px 0 80px; }
      .grid, .boundary { grid-template-columns: 1fr; }
      .boundary { gap: 32px; }
      .card { min-height: 0; }
      h3 { margin-top: 36px; }
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
        <a class="button" href="https://github.com/notambourine/shopify-cli-condom#usage">Get started</a>
      </div>
    </header>
    <section aria-labelledby="problem">
      <div class="section-heading">
        <p class="eyebrow">The missing boundary</p>
        <h2 id="problem">Theme development has no production ACL.</h2>
        <p>A Shopify theme token covers the store. The standard CLI can use that credential to target, push, replace, or publish themes. Command prompts and AGENTS.md are guidance. They are not access control.</p>
      </div>
    </section>
    <section aria-labelledby="works">
      <div class="section-heading">
        <p class="eyebrow">A narrower path</p>
        <h2 id="works">Keep the normal workflow. Remove the dangerous operations.</h2>
      </div>
      <div class="grid">
        <article class="card">
          <span class="number">01</span>
          <h3>Constrain the command</h3>
          <p>The wrapper accepts only <code>dev</code>. It rejects theme IDs, live-theme access, publishing, pushing, environments, and arbitrary CLI input.</p>
        </article>
        <article class="card">
          <span class="number">02</span>
          <h3>Seal the credential</h3>
          <p>The proxy decrypts the store token at the edge. Developers get a time-limited sealed token, not the raw Shopify credential.</p>
        </article>
        <article class="card">
          <span class="number">03</span>
          <h3>Verify every operation</h3>
          <p>The proxy allowlists Shopify requests and checks the theme's role before every scoped write and preview request.</p>
        </article>
      </div>
    </section>
    <section class="boundary" aria-labelledby="boundary">
      <div>
        <p class="eyebrow">Security boundary</p>
        <h2 id="boundary">Limits accidents, not credentials.</h2>
        <p>A raw production token remains production access. Keep it in CI or behind the proxy. Retain deployment approvals and agent command guards.</p>
      </div>
      <div class="callout"><strong>Development only.</strong> The wrapper and proxy refuse live-theme operations by construction. A stolen sealed token can still modify development themes on its bound store until it expires.</div>
    </section>
  </main>
  <footer>
    <strong>Senior engineers. No tambourine.</strong>
    <span>Open source by NoTambourine</span>
  </footer>
</body>
</html>`;

export function landing(method: string): Response {
  return new Response(method === 'HEAD' ? null : page, {
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
