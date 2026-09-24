import { readFile, writeFile } from 'node:fs/promises';

const packageRoot = new URL('../node_modules/@notambourine/brand-kit/', import.meta.url);
const variables = await readFile(new URL('vars.css', packageRoot), 'utf8');
const mark = (await readFile(new URL('logo/mark.svg', packageRoot), 'utf8'))
  .replace('<svg ', '<svg aria-hidden="true" focusable="false" ');
const favicon = (await readFile(new URL('logo/favicon.svg', packageRoot), 'utf8')).replace(/<!--[\s\S]*?-->/g, '');
const faviconUri = `data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}`;
const output = `export const brandVariables = ${JSON.stringify(variables)};\nexport const brandMark = ${JSON.stringify(mark)};\nexport const brandFavicon = ${JSON.stringify(faviconUri)};\n`;

await writeFile(new URL('../src/brand.generated.ts', import.meta.url), output);
