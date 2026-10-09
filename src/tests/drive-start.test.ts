import { describe, expect, it } from 'vitest';
import { gameStart } from '../lib/launching';
import { create, type MessageInitShape } from '@bufbuild/protobuf';
import { GameLinkState, InstanceSchema } from '../types/launcher';

const game = (patch: MessageInitShape<typeof InstanceSchema>) =>
  create(InstanceSchema, { id: 'g', pid: 1, started: 100n, running: true, ...patch });

describe('the start button follows the game it launched', () => {
  it('waits for the engine to list the game', () => {
    expect(gameStart(undefined, 100, 105)).toEqual({ progress: null });
    expect(gameStart(undefined, 100, 111)).toBeNull();
  });

  it('shows what the game reports until it runs', () => {
    expect(
      gameStart(game({ link: { state: GameLinkState.STARTING, window: true } }), 100, 101),
    ).toEqual({ progress: null });
    expect(
      gameStart(
        game({ link: { state: GameLinkState.LOADING, progress: 0.4, window: true } }),
        100,
        300,
      ),
    ).toEqual({ progress: 0.4 });
    expect(
      gameStart(game({ link: { state: GameLinkState.RUNNING, window: true } }), 100, 101),
    ).toBeNull();
    expect(
      gameStart(
        game({ link: { state: GameLinkState.FAILED, message: 'x', window: true } }),
        100,
        101,
      ),
    ).toBeNull();
  });

  it('lets go of a game that ended, is stopping, or never reports', () => {
    expect(gameStart(game({ running: false }), 100, 101)).toBeNull();
    expect(gameStart(game({ stopping: 101n }), 100, 101)).toBeNull();
    expect(gameStart(game({}), 100, 120)).toEqual({ progress: null });
    expect(gameStart(game({}), 100, 131)).toBeNull();
  });
});
