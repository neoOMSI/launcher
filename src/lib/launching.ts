import type { Instance } from '../types/launcher';

// Until the engine lists the new game, and for a game without the link (an older engine).
const UNLISTED_SECS = 10;
const UNLINKED_SECS = 30;

export interface GameStart {
  progress: number | null;
}

export function gameStart(
  game: Instance | undefined,
  launchedAt: number,
  now: number,
): GameStart | null {
  if (!game) return now - launchedAt < UNLISTED_SECS ? { progress: null } : null;
  if (!game.running || game.stopping) return null;
  const link = game.link;
  if (!link) return now - game.started < UNLINKED_SECS ? { progress: null } : null;
  if (link.state === 'starting') return { progress: null };
  if (link.state === 'loading') return { progress: link.progress };
  return null;
}
