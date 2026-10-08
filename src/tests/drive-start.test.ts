import { describe, expect, it } from 'vitest';
import { gameStart } from '../lib/launching';
import type { Instance } from '../types/launcher';

const game = (patch: Partial<Instance>): Instance =>
  ({
    id: 'g',
    pid: 1,
    started: 100,
    running: true,
    stopping: null,
    link: null,
    ...patch,
  }) as Instance;

describe('the start button follows the game it launched', () => {
  it('waits for the engine to list the game', () => {
    expect(gameStart(undefined, 100, 105)).toEqual({ progress: null });
    expect(gameStart(undefined, 100, 111)).toBeNull();
  });

  it('shows what the game reports until it runs', () => {
    expect(
      gameStart(
        game({ link: { state: 'starting', progress: null, message: '', window: true } }),
        100,
        101,
      ),
    ).toEqual({ progress: null });
    expect(
      gameStart(
        game({ link: { state: 'loading', progress: 0.4, message: '', window: true } }),
        100,
        300,
      ),
    ).toEqual({ progress: 0.4 });
    expect(
      gameStart(
        game({ link: { state: 'running', progress: null, message: '', window: true } }),
        100,
        101,
      ),
    ).toBeNull();
    expect(
      gameStart(
        game({ link: { state: 'failed', progress: null, message: 'x', window: true } }),
        100,
        101,
      ),
    ).toBeNull();
  });

  it('lets go of a game that ended, is stopping, or never reports', () => {
    expect(gameStart(game({ running: false }), 100, 101)).toBeNull();
    expect(gameStart(game({ stopping: 101 }), 100, 101)).toBeNull();
    expect(gameStart(game({}), 100, 120)).toEqual({ progress: null });
    expect(gameStart(game({}), 100, 131)).toBeNull();
  });
});
