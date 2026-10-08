import { app } from 'electron';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LauncherPrefs } from '../src/types/neoomsi';

const DEFAULTS: LauncherPrefs = {
  onLaunch: 'minimize',
  restoreOnExit: true,
  updateCheck: true,
  window: null,
};

const file = () => join(app.getPath('userData'), 'launcher-prefs.json');

let cached: LauncherPrefs | null = null;

export function loadPrefs(): LauncherPrefs {
  if (cached) return cached;
  try {
    cached = { ...DEFAULTS, ...JSON.parse(readFileSync(file(), 'utf8')) };
  } catch {
    cached = { ...DEFAULTS };
  }
  return cached!;
}

export function savePrefs(patch: Partial<LauncherPrefs>): LauncherPrefs {
  const next: LauncherPrefs = { ...loadPrefs() };
  for (const key of Object.keys(DEFAULTS) as (keyof LauncherPrefs)[]) {
    if (key in patch) (next as unknown as Record<string, unknown>)[key] = patch[key];
  }
  cached = next;
  const target = file();
  writeFileSync(`${target}.tmp`, JSON.stringify(next, null, 2));
  renameSync(`${target}.tmp`, target);
  return next;
}
