import { GameLinkState, type Instance } from '../types/launcher';

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
  if (!link) return now - Number(game.started) < UNLINKED_SECS ? { progress: null } : null;
  if (link.state === GameLinkState.STARTING) return { progress: null };
  if (link.state === GameLinkState.LOADING) return { progress: link.progress ?? null };
  return null;
}
