// Usage: node scripts/sync-engine-proto.mjs [path to a neoOMSI checkout, default ../neoOMSI]
import { copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = join(import.meta.dirname, '..');
const neoomsi = resolve(root, process.argv[2] ?? '../neoOMSI');
const source = join(neoomsi, 'crates', 'launcher-protocol', 'proto', 'launcher.proto');
copyFileSync(source, join(root, 'proto', 'launcher.proto'));
console.log(`${source} -> proto/launcher.proto`);
