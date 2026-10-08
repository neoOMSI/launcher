import { describe, expect, it } from 'vitest';
import { MockLauncher } from '../../electron/mock/launcher';
import {
  canInstall,
  enqueue,
  filterInstalled,
  isRunning,
  jobProgress,
  readMods,
  splitJobs,
  stateTone,
  usedInPlace,
} from '../pages/mods/logic';
import type { InstallProgress, InstalledMod, SourceInfo } from '../types/launcher';

const job = (patch: Partial<InstallProgress>): InstallProgress => ({
  id: 1,
  source: 'C:\\x.zip',
  name: 'x',
  state: 'unpacking',
  mode: 'auto',
  files_done: 0,
  files_total: 0,
  bytes_done: 0,
  bytes_total: 0,
  free_bytes: 0,
  needed_bytes: 0,
  message: '',
  report: [],
  warnings: [],
  installed: [],
  kept_aside: [],
  from_inbox: false,
  started: 100,
  finished: null,
  ...patch,
});

const info = (patch: Partial<SourceInfo>): SourceInfo => ({
  is_archive: true,
  is_zip: true,
  files: 10,
  unpacked_bytes: 1,
  archive_bytes: 1,
  needed_bytes: 1,
  free_bytes: 2,
  fits: true,
  in_place: '',
  in_place_ok: true,
  suggested: 'extract',
  ...patch,
});

describe('mods logic', () => {
  it('measures progress by bytes, then files, and not at all before planning', () => {
    expect(
      jobProgress(job({ bytes_done: 25, bytes_total: 100, files_done: 9, files_total: 10 })),
    ).toBe(0.25);
    expect(jobProgress(job({ files_done: 3, files_total: 4 }))).toBe(0.75);
    expect(jobProgress(job({ state: 'planning' }))).toBeNull();
    expect(jobProgress(job({ state: 'done' }))).toBe(1);
    expect(jobProgress(job({ bytes_done: 130, bytes_total: 100 }))).toBe(1);
  });

  it('puts running jobs first (oldest first) and finished ones newest first', () => {
    const { running, finished } = splitJobs([
      job({ id: 1, state: 'done', finished: 10 }),
      job({ id: 2, started: 300 }),
      job({ id: 3, state: 'failed', finished: 50 }),
      job({ id: 4, started: 200 }),
    ]);
    expect(running.map((j) => j.id)).toEqual([4, 2]);
    expect(finished.map((j) => j.id)).toEqual([3, 1]);
  });

  it('gives each state a tone', () => {
    expect(stateTone('copying')).toBe('busy');
    expect(stateTone('done')).toBe('ok');
    expect(stateTone('failed')).toBe('danger');
    expect(stateTone('cancelled')).toBe('muted');
  });

  it('only allows a mode that can work', () => {
    const tooBig = info({ fits: false });
    expect(canInstall(tooBig, 'extract')).toBe(false);
    expect(canInstall(tooBig, 'inplace')).toBe(true);
    expect(canInstall(tooBig, 'auto')).toBe(true);
    const sevenZip = info({ is_zip: false, in_place_ok: false, fits: false });
    expect(canInstall(sevenZip, 'auto')).toBe(false);
    expect(canInstall(info({ in_place_ok: false }), 'inplace')).toBe(false);
  });

  it('searches installed mods by name and folder, newest first', () => {
    const mods: InstalledMod[] = [
      { name: 'MAN_NL202', installed: 1, folders: ['Vehicles/MAN_NL202'], size: 1 },
      { name: 'Spandau', installed: 3, folders: ['maps/Berlin-Spandau'], size: 1 },
      { name: 'Neuhausen', installed: 2, folders: ['Archives/Neuhausen.zip'], size: 1 },
    ];
    expect(filterInstalled(mods, '').map((m) => m.name)).toEqual([
      'Spandau',
      'Neuhausen',
      'MAN_NL202',
    ]);
    expect(filterInstalled(mods, 'berlin').map((m) => m.name)).toEqual(['Spandau']);
    expect(usedInPlace(mods[2])).toBe(true);
    expect(usedInPlace(mods[0])).toBe(false);
  });

  it('queues each dropped path once', () => {
    expect(enqueue(['a.zip'], ['b.7z', 'a.zip', '', 'b.7z'])).toEqual(['a.zip', 'b.7z']);
  });
});

describe('reading what the engine sends', () => {
  it('fills in every list the engine leaves out', () => {
    const mods = readMods({
      content_dir: 'C:/content',
      jobs: [{ id: 7, source: 'C:/x/Bus.zip' } as InstallProgress],
    });
    expect(mods.installed).toEqual([]);
    expect(mods.folders).toEqual([]);
    expect(mods.cleaned).toEqual([]);
    expect(mods.jobs[0]).toMatchObject({
      name: 'Bus.zip',
      report: [],
      warnings: [],
      finished: null,
    });
  });

  it('does not treat an ended job without an end time as running', () => {
    expect(isRunning(job({ state: 'failed', finished: undefined as unknown as null }))).toBe(false);
    expect(isRunning(job({}))).toBe(true);
  });
});

describe('mock mods engine', () => {
  it('walks a started install through to done and lists the mod', () => {
    const engine = new MockLauncher();
    const started = engine.handle('start_install', {
      path: 'C:\\Downloads\\Citaro_K.zip',
      mode: 'auto',
    });
    expect(started.state).toBe('queued');
    const seen = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const j = engine.handle('mods', undefined).jobs.find((x) => x.id === started.id)!;
      seen.add(j.state);
    }
    expect([...seen]).toEqual(
      expect.arrayContaining(['planning', 'checking', 'unpacking', 'moving', 'done']),
    );
    const mods = engine.handle('mods', undefined);
    expect(mods.installed?.[0].name).toBe('Citaro_K');

    const { uninstalled } = engine.handle('uninstall_mod', { name: 'Citaro_K' });
    expect(uninstalled).toEqual(['Vehicles/Citaro_K']);
    expect(
      (engine.handle('mods', undefined).installed ?? []).some((m) => m.name === 'Citaro_K'),
    ).toBe(false);
  });
});
