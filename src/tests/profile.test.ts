import { describe, expect, it } from 'vitest';
import { levelProgress, punctuality, rating, totals } from '../pages/profile/stats';
import { create, type MessageInitShape } from '@bufbuild/protobuf';
import { SessionSchema } from '../types/launcher';

const session = (patch: MessageInitShape<typeof SessionSchema>) =>
  create(SessionSchema, {
    driver: 'Jakob',
    map: 'Grundorf',
    bus: 'Vehicles/MAN/MAN SL200.bus',
    line: '24',
    tour: '2',
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
    expect(levelProgress({ xp: 5810n, level: 5n, nextLevelXp: 6250n })).toEqual({
      fraction: (5810 - 4000) / (6250 - 4000),
      toNext: 440,
    });
    expect(levelProgress({ xp: 0n, level: 1n, nextLevelXp: 250n }).fraction).toBe(0);
    expect(levelProgress({ xp: 300n, level: 1n, nextLevelXp: 250n })).toEqual({
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
