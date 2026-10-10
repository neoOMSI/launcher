#!/usr/bin/env node
// Canonical Electron packaging entry point for neoOMSI Launcher.
// Used by both launcher CI and engine packaging scripts.
// Usage: node scripts/package-app.mjs --platform <windows|macos|linux> --arch <x64|arm64> [--out <output-dir>]

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const electronBuilderCli = require.resolve('electron-builder/out/cli/cli.js');
const root = join(import.meta.dirname, '..');

const args = process.argv.slice(2);
let platform = '';
let arch = '';
let outputDir = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--platform' && i + 1 < args.length) {
    platform = args[++i];
  } else if (args[i] === '--arch' && i + 1 < args.length) {
    arch = args[++i];
  } else if (args[i] === '--out' && i + 1 < args.length) {
    outputDir = args[++i];
  }
}

if (!platform || !arch) {
  console.error(
    'Usage: node scripts/package-app.mjs --platform <windows|macos|linux> --arch <x64|arm64> [--out <output-dir>]',
  );
  process.exit(1);
}

const platformFlags = {
  windows: '--win',
  macos: '--mac',
  linux: '--linux',
};

const flag = platformFlags[platform];
if (!flag) {
  console.error(`Unsupported platform: '${platform}'. Must be windows, macos, or linux.`);
  process.exit(1);
}

if (arch !== 'x64' && arch !== 'arm64') {
  console.error(`Unsupported architecture: '${arch}'. Must be x64 or arm64.`);
  process.exit(1);
}

const out = outputDir ? resolve(root, outputDir) : resolve(root, `release/${platform}-${arch}`);

console.log(`Packaging neoOMSI Launcher for ${platform}-${arch} into ${out}...`);

const builderArgs = [
  electronBuilderCli,
  '--dir',
  flag,
  `--${arch}`,
  `-c.directories.output=${out}`,
];

const result = spawnSync(process.execPath, builderArgs, {
  cwd: root,
  stdio: 'inherit',
  shell: false,
});

if (result.status !== 0) {
  if (result.error) {
    console.error(`Packaging failed to start:`, result.error);
  } else {
    console.error(`Packaging failed with exit code ${result.status}`);
  }
  process.exit(result.status ?? 1);
}

// Verify that the expected platform executable was produced
let expectedExe = '';
if (platform === 'windows') {
  const dirName = arch === 'arm64' ? 'win-arm64-unpacked' : 'win-unpacked';
  expectedExe = join(out, dirName, 'neoOMSI Launcher.exe');
} else if (platform === 'linux') {
  const dirName = arch === 'arm64' ? 'linux-arm64-unpacked' : 'linux-unpacked';
  expectedExe = join(out, dirName, 'neoomsi-launcher-app');
} else if (platform === 'macos') {
  const dirName = arch === 'arm64' ? 'mac-arm64' : 'mac';
  expectedExe = join(out, dirName, 'neoOMSI Launcher.app', 'Contents', 'MacOS', 'neoOMSI Launcher');
  if (!existsSync(expectedExe)) {
    expectedExe = join(out, 'mac', 'neoOMSI Launcher.app', 'Contents', 'MacOS', 'neoOMSI Launcher');
  }
}

if (!existsSync(expectedExe)) {
  console.error(
    `Packaging validation failed: expected output executable not found at ${expectedExe}`,
  );
  process.exit(1);
}

console.log(`Verified packaged launcher executable at ${expectedExe}`);
