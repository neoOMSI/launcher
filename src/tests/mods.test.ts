import { describe, expect, it } from 'vitest';
import { create, type MessageInitShape } from '@bufbuild/protobuf';
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
import {
  InstallMode,
  InstallProgressSchema,
  InstallState,
  ModsStatusSchema,
  SourceInfoSchema,
  type InstalledMod,
} from '../types/launcher';

const job = (patch: MessageInitShape<typeof InstallProgressSchema>) =>
  create(InstallProgressSchema, {
    id: 1n,
    source: 'C:\\x.zip',
    name: 'x',
    state: InstallState.UNPACKING,
    mode: InstallMode.AUTO,
    started: 100n,
    ...patch,
  });

const info = (patch: MessageInitShape<typeof SourceInfoSchema>) =>
  create(SourceInfoSchema, {
    isArchive: true,
    isZip: true,
    files: 10n,
    unpackedBytes: 1n,
    archiveBytes: 1n,
    neededBytes: 1n,
    freeBytes: 2n,
    fits: true,
    inPlaceOk: true,
    suggested: InstallMode.EXTRACT,
    ...patch,
  });

describe('mods logic', () => {
  it('measures progress by bytes, then files, and not at all before planning', () => {
    expect(
      jobProgress(job({ bytesDone: 25n, bytesTotal: 100n, filesDone: 9n, filesTotal: 10n })),
    ).toBe(0.25);
    expect(jobProgress(job({ filesDone: 3n, filesTotal: 4n }))).toBe(0.75);
    expect(jobProgress(job({ state: InstallState.PLANNING }))).toBeNull();
    expect(jobProgress(job({ state: InstallState.DONE }))).toBe(1);
    expect(jobProgress(job({ bytesDone: 130n, bytesTotal: 100n }))).toBe(1);
  });

  it('puts running jobs first (oldest first) and finished ones newest first', () => {
    const { running, finished } = splitJobs([
      job({ id: 1n, state: InstallState.DONE, finished: 10n }),
      job({ id: 2n, started: 300n }),
      job({ id: 3n, state: InstallState.FAILED, finished: 50n }),
      job({ id: 4n, started: 200n }),
    ]);
    expect(running.map((j) => j.id)).toEqual([4n, 2n]);
    expect(finished.map((j) => j.id)).toEqual([3n, 1n]);
  });

  it('gives each state a tone', () => {
    expect(stateTone(InstallState.COPYING)).toBe('busy');
    expect(stateTone(InstallState.DONE)).toBe('ok');
    expect(stateTone(InstallState.FAILED)).toBe('danger');
    expect(stateTone(InstallState.CANCELLED)).toBe('muted');
  });

  it('only allows a mode that can work', () => {
    const tooBig = info({ fits: false });
    expect(canInstall(tooBig, InstallMode.EXTRACT)).toBe(false);
    expect(canInstall(tooBig, InstallMode.IN_PLACE)).toBe(true);
    expect(canInstall(tooBig, InstallMode.AUTO)).toBe(true);
    const sevenZip = info({ isZip: false, inPlaceOk: false, fits: false });
    expect(canInstall(sevenZip, InstallMode.AUTO)).toBe(false);
    expect(canInstall(info({ inPlaceOk: false }), InstallMode.IN_PLACE)).toBe(false);
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
  it('lists no installed mods while the engine does not send them', () => {
    expect(readMods(create(ModsStatusSchema, { contentDir: 'C:/content' })).installed).toEqual([]);
  });

  it('does not treat an ended job without an end time as running', () => {
    expect(isRunning(job({ state: InstallState.FAILED }))).toBe(false);
    expect(isRunning(job({}))).toBe(true);
  });
});

describe('mock mods engine', () => {
  it('walks a started install through to done and lists the mod', async () => {
    const engine = new MockLauncher();
    const started = await engine.handle('startInstall', {
      path: 'C:\\Downloads\\Citaro_K.zip',
      mode: InstallMode.AUTO,
    });
    expect(started.state).toBe(InstallState.QUEUED);
    const seen = new Set<InstallState>();
    for (let i = 0; i < 12; i++) {
      engine.advanceJobs();
      const j = (await engine.handle('mods', {})).jobs.find((x) => x.id === started.id)!;
      seen.add(j.state);
    }
    expect([...seen]).toEqual(
      expect.arrayContaining([
        InstallState.PLANNING,
        InstallState.CHECKING,
        InstallState.UNPACKING,
        InstallState.MOVING,
        InstallState.DONE,
      ]),
    );
    const mods = await engine.handle('mods', {});
    expect(mods.installed?.[0].name).toBe('Citaro_K');

    const { uninstalled } = await engine.handle('uninstallMod', { name: 'Citaro_K' });
    expect(uninstalled).toEqual(['Vehicles/Citaro_K']);
    expect(
      ((await engine.handle('mods', {})).installed ?? []).some((m) => m.name === 'Citaro_K'),
    ).toBe(false);
  });
});
