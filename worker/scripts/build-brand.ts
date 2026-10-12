import { readFile, writeFile } from 'node:fs/promises';

const packageRoot = new URL('../node_modules/@notambourine/brand-kit/', import.meta.url);
const read = (path: string) => readFile(new URL(path, packageRoot), 'utf8');
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

// The landing CSP has no font origin, so faces ship as data URIs. The page uses no live wordmark text or mono italic.
const faces = new Set(['hanken-grotesk-latin-var.woff2', 'hanken-grotesk-latin-var-italic.woff2', 'jetbrains-mono-latin-var.woff2']);
const fontFaces = [];
for (const rule of stripComments(await read('fonts.css')).match(/@font-face\s*\{[^}]*\}/g) ?? []) {
  const file = /url\('\.\/fonts\/([^']+)'\)/.exec(rule)?.[1];
  if (!file || !faces.has(file)) continue;
  const data = (await readFile(new URL(`fonts/${file}`, packageRoot))).toString('base64');
  fontFaces.push(rule.replace(`./fonts/${file}`, `data:font/woff2;base64,${data}`));
}
if (fontFaces.length !== faces.size) throw new Error('brand-kit fonts.css no longer declares every landing face.');

const styles = [fontFaces.join('\n'), ...(await Promise.all(['vars.css', 'elements.css', 'components.css'].map(read))).map(stripComments)].join('\n');
const mark = (await read('logo/mark.svg')).replace('<svg ', '<svg aria-hidden="true" focusable="false" ');
const favicon = (await read('logo/favicon.svg')).replace(/<!--[\s\S]*?-->/g, '');
const faviconUri = `data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}`;
const ogImage = (await readFile(new URL('../assets/og.png', import.meta.url))).toString('base64');
const output = `export const brandStyles = ${JSON.stringify(styles)};\nexport const brandMark = ${JSON.stringify(mark)};\nexport const brandFavicon = ${JSON.stringify(faviconUri)};\nexport const ogImage = ${JSON.stringify(ogImage)};\n`;

await writeFile(new URL('../src/brand.generated.ts', import.meta.url), output);
