import { describe, expect, it } from 'vitest';
import { chatLine, clock, exitCodeText, exitState, readLan } from '../pages/sessions/clock';

const game = { running: false, stopping: null, killed: false, exit_code: null };

describe('sessions', () => {
  it('formats an uptime as a clock', () => {
    expect(clock(0)).toBe('0:00');
    expect(clock(65)).toBe('1:05');
    expect(clock(47 * 60 + 3)).toBe('47:03');
    expect(clock(3600 + 2 * 60 + 9.8)).toBe('1:02:09');
    expect(clock(26 * 3600)).toBe('26:00:00');
    expect(clock(-4)).toBe('0:00');
  });

  it('tells how a game ended', () => {
    expect(exitState({ ...game, running: true })).toBe('running');
    expect(exitState({ ...game, running: true, stopping: 1 })).toBe('stopping');
    expect(exitState({ ...game, exit_code: 0 })).toBe('clean');
    expect(exitState({ ...game, killed: true, stopping: 1 })).toBe('killed');
    expect(exitState({ ...game, exit_code: 3 })).toBe('crashed');
    expect(exitState(game)).toBe('ended');
  });

  it('shows Windows crash codes in hex', () => {
    expect(exitCodeText(1)).toBe('1');
    expect(exitCodeText(-1073741819)).toBe('0xC0000005');
    expect(exitCodeText(3221225477)).toBe('0xC0000005');
  });

  it('fills in a partial LAN status', () => {
    expect(readLan(null)).toBeNull();
    expect(readLan({ role: 'host', code: 'OMSI-1' })).toMatchObject({
      role: 'host',
      code: 'OMSI-1',
      players: [],
      chat: [],
      warnings: [],
    });
  });

  it('splits chat lines into author and text', () => {
    expect(chatLine('Lena K.: Bin gleich da')).toEqual(['Lena K.', 'Bin gleich da']);
    expect(chatLine('ole joined')).toEqual([null, 'ole joined']);
  });
});
