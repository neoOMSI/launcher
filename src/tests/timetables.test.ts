import { describe, expect, it } from 'vitest';
import {
  byHour,
  dayRange,
  departures,
  dutyPatch,
  firstAfter,
  hourLabel,
  matchesStop,
  parseClock,
  shiftDate,
  startTime,
  stopAt,
  stopClock,
  todayIso,
  tourBlocks,
  tourEnd,
  toursServing,
  tripSeconds,
} from '../pages/timetables/timetable';
import type { LineInfo, TourInfo, TripInfo } from '../types/launcher';

const trip = (index: number, departure: number, names: string[]): TripInfo => ({
  name: `t${index}`,
  index,
  line: '24',
  from: names[0],
  terminus: names[names.length - 1],
  departure,
  arrival: departure + (names.length - 1) * 180,
  km: 6.4,
  stops: names.map((name, i) => ({
    name,
    arr: i === 0 ? -1 : departure + i * 180,
    dep: i === names.length - 1 ? -1 : departure + i * 180,
  })),
});

const tour = (number: string, runs: boolean, trips: TripInfo[]): TourInfo => ({
  number,
  ai_group: `24-${number}`,
  first: trips[0]?.departure ?? 0,
  last: trips[trips.length - 1]?.arrival ?? 0,
  days: 'Mon-Fri',
  runs,
  next_run: runs ? null : '2026-10-12',
  trips,
});

const LINES: LineInfo[] = [
  {
    name: '24',
    user_allowed: true,
    termini: ['Hauptbahnhof', 'Rathaus'],
    tours: [
      tour('1', false, [trip(0, 5 * 3600, ['Hauptbahnhof', 'Lindenallee', 'Rathaus'])]),
      tour('2', true, [
        trip(0, 6 * 3600, ['Hauptbahnhof', 'Lindenallee', 'Rathaus']),
        trip(1, 7 * 3600, ['Rathaus', 'Lindenallee', 'Hauptbahnhof']),
      ]),
    ],
  },
  {
    name: 'N7',
    user_allowed: false,
    termini: ['Bahnhof', 'Siedlung'],
    tours: [
      tour('1', true, [trip(0, 23 * 3600 + 50 * 60, ['Bahnhof', 'Gewerbegebiet', 'Siedlung'])]),
    ],
  },
];

describe('departure board', () => {
  it('lists the trips of running tours by departure', () => {
    const list = departures(LINES, '', '');
    expect(list.map((d) => [d.line.name, d.time])).toEqual([
      ['24', 6 * 3600],
      ['24', 7 * 3600],
      ['N7', 23 * 3600 + 50 * 60],
    ]);
    expect(list.every((d) => d.stop === null)).toBe(true);
  });

  it('filters by line', () => {
    expect(departures(LINES, 'N7', '').map((d) => d.line.name)).toEqual(['N7']);
  });

  it('shows the time at a searched stop and skips trips that only end there', () => {
    const list = departures(LINES, '', 'linden');
    expect(list.map((d) => [d.time, d.stop])).toEqual([
      [6 * 3600 + 180, 'Lindenallee'],
      [7 * 3600 + 180, 'Lindenallee'],
    ]);
    expect(departures(LINES, '', 'rathaus').map((d) => d.time)).toEqual([7 * 3600]);
    expect(departures(LINES, '', 'nowhere')).toEqual([]);
  });

  it('finds the first departing stop that matches', () => {
    const t = LINES[0].tours[1].trips[0];
    expect(stopAt(t, 'LINDEN')?.name).toBe('Lindenallee');
    expect(stopAt(t, 'rathaus')).toBeUndefined();
  });

  it('keeps only tours that serve a searched stop', () => {
    expect(toursServing(LINES[1].tours, 'gewerbe')).toHaveLength(1);
    expect(toursServing(LINES[1].tours, 'linden')).toHaveLength(0);
    expect(toursServing(LINES[0].tours, ' ')).toHaveLength(2);
  });

  it('groups by hour, keeping hours after midnight apart', () => {
    const groups = byHour([
      { time: 6 * 3600 },
      { time: 6 * 3600 + 59 * 60 },
      { time: 7 * 3600 },
      { time: 24 * 3600 + 60 },
    ]);
    expect(groups.map((g) => [g.hour, g.items.length])).toEqual([
      [6, 2],
      [7, 1],
      [24, 1],
    ]);
    expect(hourLabel(6)).toBe('06:00');
    expect(hourLabel(24)).toBe('00:00');
  });

  it('reads a clock and finds the next departure', () => {
    expect(parseClock('07:30')).toBe(7 * 3600 + 1800);
    expect(parseClock('7:05:00')).toBe(7 * 3600 + 300);
    expect(parseClock('25:00')).toBeNull();
    expect(parseClock('')).toBeNull();
    const list = departures(LINES, '', '');
    expect(firstAfter(list, 6 * 3600 + 1)).toBe(1);
    expect(firstAfter(list, 23 * 3600 + 59 * 60)).toBe(-1);
  });

  it('spans the day bar over whole hours and places each trip in it', () => {
    const range = dayRange(LINES);
    expect(range).toEqual({ start: 5 * 3600, end: 24 * 3600 });
    const [block] = tourBlocks(LINES[0].tours[0], range);
    expect(block.left).toBe(0);
    expect(block.width).toBeCloseTo(360 / (19 * 3600));
    expect(dayRange([])).toEqual({ start: 0, end: 86400 });
  });

  it('ends a tour after its last trip, across midnight', () => {
    expect(tourEnd(LINES[1].tours[0])).toBe(23 * 3600 + 56 * 60);
  });

  it('highlights stops only for a real query', () => {
    expect(matchesStop('Lindenallee', 'LINDEN')).toBe(true);
    expect(matchesStop('Lindenallee', '')).toBe(false);
  });
});

describe('timetable time math', () => {
  it('measures trips across midnight', () => {
    expect(tripSeconds({ departure: 3600, arrival: 4500 })).toBe(900);
    expect(tripSeconds({ departure: 23 * 3600 + 50 * 60, arrival: 10 * 60 })).toBe(20 * 60);
  });

  it('starts three minutes before the departure, wrapping at midnight', () => {
    expect(startTime(6 * 3600)).toBe('05:57');
    expect(startTime(60)).toBe('23:58');
  });

  it('shows the departure and the arrival only when they differ', () => {
    expect(stopClock({ name: 'A', arr: -1, dep: 3600 })).toEqual({ time: '01:00', arrival: null });
    expect(stopClock({ name: 'B', arr: 3600, dep: 3620 })).toEqual({
      time: '01:00',
      arrival: null,
    });
    expect(stopClock({ name: 'C', arr: 3600, dep: 3780 })).toEqual({
      time: '01:03',
      arrival: '01:00',
    });
    expect(stopClock({ name: 'D', arr: 3900, dep: -1 })).toEqual({ time: '01:05', arrival: null });
  });

  it('formats today as a local ISO date', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('moves the date by whole days across month ends', () => {
    expect(shiftDate('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDate('nonsense', 1)).toBe('nonsense');
  });
});

describe('timetable duty', () => {
  const line = LINES[0];

  it('drives a whole tour from its first trip', () => {
    const patch = dutyPatch(
      { map: 'maps/Grundorf/global.cfg' },
      {
        map: 'maps/Grundorf/global.cfg',
        date: '2026-10-07',
        line,
        tour: line.tours[1],
      },
    );
    expect(patch).toMatchObject({
      line: '24',
      tour: '2',
      trip: '',
      time: '05:57',
      date: '2026-10-07',
      free: false,
      stop: null,
      entry: -1,
    });
    expect(patch).not.toHaveProperty('hof');
  });

  it('drives one trip and moves to the next running day', () => {
    const patch = dutyPatch(
      { map: 'maps/Other/global.cfg' },
      {
        map: 'maps/Grundorf/global.cfg',
        date: '2026-10-10',
        line,
        tour: line.tours[0],
        trip: line.tours[0].trips[0],
      },
    );
    expect(patch).toMatchObject({ trip: '0', time: '04:57', date: '2026-10-12', hof: '' });
  });
});
