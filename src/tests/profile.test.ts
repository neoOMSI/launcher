import { describe, expect, it } from 'vitest';
import { levelProgress, punctuality, rating, totals } from '../pages/profile/stats';
import type { Session } from '../types/launcher';

const session = (patch: Partial<Session>): Session => ({
  time: 0,
  driver: 'Jakob',
  map: 'Grundorf',
  bus: 'Vehicles/MAN/MAN SL200.bus',
  line: '24',
  tour: '2',
  seconds: 0,
  metres: 0,
  stops: 0,
  early: 0,
  late: 0,
  tickets: 0,
  cash: 0,
  crashes: 0,
  hurt: 0,
  jolts: 0,
  driving: 100,
  comfort: 100,
  ticketing: 100,
  ...patch,
});

describe('profile stats', () => {
  it('counts the stops neither early nor late as on time', () => {
    expect(punctuality(100, 10, 15)).toBe(0.75);
    expect(punctuality(3912, 214, 388)).toBeCloseTo(0.846, 3);
  });

  it('has no punctuality without stops and never goes below zero', () => {
    expect(punctuality(0, 0, 0)).toBeNull();
    expect(punctuality(4, 3, 3)).toBe(0);
  });

  it('measures the XP from the start of the current level', () => {
    expect(levelProgress({ xp: 5810, level: 5, next_level_xp: 6250 })).toEqual({
      fraction: (5810 - 4000) / (6250 - 4000),
      toNext: 440,
    });
    expect(levelProgress({ xp: 0, level: 1, next_level_xp: 250 }).fraction).toBe(0);
    expect(levelProgress({ xp: 300, level: 1, next_level_xp: 250 })).toEqual({
      fraction: 1,
      toNext: 0,
    });
  });

  it('turns per-cent ratings into a clamped fraction', () => {
    expect(rating(84)).toBe(0.84);
    expect(rating(130)).toBe(1);
    expect(rating(-5)).toBe(0);
    expect(rating(Number.NaN)).toBe(0);
  });

  it('adds up runs', () => {
    const sum = totals([
      session({
        seconds: 3600,
        metres: 31400,
        stops: 90,
        early: 1,
        late: 4,
        tickets: 120,
        cash: 190.5,
      }),
      session({ seconds: 1800, metres: 6100, crashes: 2, tickets: 3, cash: 8.1 }),
    ]);
    expect(sum).toEqual({
      runs: 2,
      seconds: 5400,
      km: 37.5,
      stops: 90,
      early: 1,
      late: 4,
      tickets: 123,
      cash: 198.6,
      crashes: 2,
    });
    expect(totals([]).runs).toBe(0);
  });
});
