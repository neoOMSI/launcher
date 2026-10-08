import { t } from '../../i18n';
import type { Profile, Session } from '../../types/launcher';

const clamp = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));

export function punctuality(stops: number, early: number, late: number): number | null {
  if (stops <= 0) return null;
  return clamp((stops - early - late) / stops);
}

// The engine's levels grow with the square root of the XP: level n starts at (n-1)² × 250.
export function levelProgress({
  xp,
  level,
  next_level_xp,
}: Pick<Profile, 'xp' | 'level' | 'next_level_xp'>) {
  const from = (level - 1) ** 2 * 250;
  return {
    fraction: clamp((xp - from) / Math.max(1, next_level_xp - from)),
    toNext: Math.max(0, next_level_xp - xp),
  };
}

// Ratings are per cent (0–100), from the personnel file or the game's session summary.
export const rating = (percent: number) => clamp(percent / 100);

export interface Totals {
  runs: number;
  seconds: number;
  km: number;
  stops: number;
  early: number;
  late: number;
  tickets: number;
  cash: number;
  crashes: number;
}

export function totals(sessions: readonly Session[]): Totals {
  const sum: Totals = {
    runs: sessions.length,
    seconds: 0,
    km: 0,
    stops: 0,
    early: 0,
    late: 0,
    tickets: 0,
    cash: 0,
    crashes: 0,
  };
  for (const s of sessions) {
    sum.seconds += s.seconds;
    sum.km += s.metres / 1000;
    sum.stops += s.stops;
    sum.early += s.early;
    sum.late += s.late;
    sum.tickets += s.tickets;
    sum.cash += s.cash;
    sum.crashes += s.crashes;
  }
  return sum;
}

export function nameProblem(name: string, taken: readonly string[]): string | null {
  const clean = name.trim();
  if (!clean) return null;
  if (/[/\\:*?"<>|]/.test(clean)) return t('profile.create.badName');
  if (taken.some((n) => n.toLowerCase() === clean.toLowerCase())) {
    return t('profile.create.taken', { name: clean });
  }
  return null;
}
