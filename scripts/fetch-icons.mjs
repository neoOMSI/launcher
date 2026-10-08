// Usage: node scripts/fetch-icons.mjs <name> [name...] (Material Symbols names, e.g. crop_square)
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '..', 'assets', 'icons', 'material');
const url = (name) =>
  `https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/${name}/fill1/48px.svg`;

let failed = false;
for (const name of process.argv.slice(2)) {
  const file = join(dir, `${name}.svg`);
  if (existsSync(file)) continue;
  const response = await fetch(url(name));
  const svg = await response.text();
  if (!response.ok || !svg.includes(' d="')) {
    console.error(`${name}: not found (${response.status})`);
    failed = true;
    continue;
  }
  writeFileSync(file, svg);
  console.log(`${name}: ok`);
}
process.exit(failed ? 1 : 0);
