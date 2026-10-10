// Usage: node scripts/sync-engine-proto.mjs [path to a neoOMSI checkout, default candidates: ../neoOMSI, ../engine, ../../engine]
import { copyFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = join(import.meta.dirname, '..');
const candidates = process.argv[2]
  ? [resolve(root, process.argv[2])]
  : [
      resolve(root, '../neoOMSI'),
      resolve(root, '../engine'),
      resolve(root, '../../engine'),
      resolve(root, '../../neoOMSI/engine'),
    ];

let source = null;
for (const cand of candidates) {
  const file = join(cand, 'crates', 'launcher-protocol', 'proto', 'launcher.proto');
  if (existsSync(file)) {
    source = file;
    break;
  }
}

if (!source) {
  console.error(
    `Error: launcher.proto not found in candidates:\n${candidates.map((c) => `  - ${c}`).join('\n')}`,
  );
  process.exit(1);
}

copyFileSync(source, join(root, 'proto', 'launcher.proto'));
console.log(`${source} -> proto/launcher.proto`);
