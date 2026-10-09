import { describe, expect, it } from 'vitest';
import { chatLine, clock, exitCodeText, exitState } from '../pages/sessions/clock';

const game = { running: false, killed: false };

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
    expect(exitState({ ...game, running: true, stopping: 1n })).toBe('stopping');
    expect(exitState({ ...game, exitCode: 0 })).toBe('clean');
    expect(exitState({ ...game, killed: true, stopping: 1n })).toBe('killed');
    expect(exitState({ ...game, exitCode: 3 })).toBe('crashed');
    expect(exitState(game)).toBe('ended');
  });

  it('shows Windows crash codes in hex', () => {
    expect(exitCodeText(1)).toBe('1');
    expect(exitCodeText(-1073741819)).toBe('0xC0000005');
    expect(exitCodeText(3221225477)).toBe('0xC0000005');
  });

  it('splits chat lines into author and text', () => {
    expect(chatLine('Lena K.: Bin gleich da')).toEqual(['Lena K.', 'Bin gleich da']);
    expect(chatLine('ole joined')).toEqual([null, 'ole joined']);
  });
});
