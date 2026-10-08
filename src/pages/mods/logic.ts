import type {
  InstallMode,
  InstallProgress,
  InstallState,
  InstalledMod,
  ModsStatus,
  SourceInfo,
} from '../../types/launcher';

const ENDED: readonly InstallState[] = ['done', 'failed', 'cancelled'];

export const isRunning = (job: InstallProgress) =>
  job.finished == null && !ENDED.includes(job.state);

export function jobProgress(job: InstallProgress): number | null {
  if (job.state === 'done') return 1;
  const fraction =
    job.bytes_total > 0
      ? job.bytes_done / job.bytes_total
      : job.files_total > 0
        ? job.files_done / job.files_total
        : null;
  return fraction === null ? null : Math.min(1, Math.max(0, fraction));
}

export function splitJobs(jobs: InstallProgress[]) {
  const running = jobs.filter(isRunning).sort((a, b) => a.started - b.started || a.id - b.id);
  const finished = jobs
    .filter((j) => !isRunning(j))
    .sort((a, b) => (b.finished ?? 0) - (a.finished ?? 0) || b.id - a.id);
  return { running, finished };
}

export type StateTone = 'busy' | 'ok' | 'danger' | 'muted';

export function stateTone(state: InstallState): StateTone {
  if (state === 'done') return 'ok';
  if (state === 'failed') return 'danger';
  if (state === 'cancelled') return 'muted';
  return 'busy';
}

export function canInstall(info: SourceInfo, mode: InstallMode): boolean {
  if (!info.is_archive) return info.fits;
  if (mode === 'inplace') return info.in_place_ok;
  if (mode === 'extract') return info.fits;
  return info.fits || info.in_place_ok;
}

export const autoTakes = (info: SourceInfo): Exclude<InstallMode, 'auto'> =>
  info.suggested === 'inplace' ? 'inplace' : 'extract';

export function filterInstalled(mods: InstalledMod[], query: string): InstalledMod[] {
  const q = query.trim().toLowerCase();
  return mods
    .filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.folders.some((f) => f.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.installed - a.installed || a.name.localeCompare(b.name));
}

export const usedInPlace = (mod: InstalledMod) =>
  mod.folders.length > 0 && mod.folders.every((f) => /^Archives[\\/]/i.test(f));

export const fileName = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path;

export function enqueue(queue: string[], paths: string[]): string[] {
  const next = [...queue];
  for (const p of paths) if (p && !next.includes(p)) next.push(p);
  return next;
}

export function readJob(
  job: Partial<InstallProgress> & Pick<InstallProgress, 'id'>,
): InstallProgress {
  return {
    source: '',
    name: fileName(job.source ?? '') || `#${job.id}`,
    state: 'queued',
    mode: 'auto',
    files_done: 0,
    files_total: 0,
    bytes_done: 0,
    bytes_total: 0,
    free_bytes: 0,
    needed_bytes: 0,
    message: '',
    from_inbox: false,
    started: 0,
    ...job,
    finished: job.finished ?? null,
    report: job.report ?? [],
    warnings: job.warnings ?? [],
    installed: job.installed ?? [],
    kept_aside: job.kept_aside ?? [],
  };
}

export type Mods = Required<ModsStatus>;

export function readMods(raw: Partial<ModsStatus>): Mods {
  return {
    content_dir: raw.content_dir ?? '',
    inbox: raw.inbox ?? '',
    free_bytes: raw.free_bytes ?? 0,
    folders: raw.folders ?? [],
    inbox_items: raw.inbox_items ?? [],
    waiting: raw.waiting ?? [],
    archives: raw.archives ?? [],
    cleaned: raw.cleaned ?? [],
    jobs: (raw.jobs ?? []).map(readJob),
    installed: (raw.installed ?? []).map((m) => ({
      ...m,
      installed: m.installed ?? 0,
      size: m.size ?? 0,
      folders: m.folders ?? [],
    })),
  };
}
