import type { Choice } from '../../lib/duty';
import { hhmm } from '../../lib/format';
import type { LineInfo, StopInfo, TourInfo, TripInfo } from '../../types/launcher';

export const LEAD_SECONDS = 180;
const DAY = 86400;

export const matchesStop = (name: string, query: string) => {
  const q = query.trim().toLowerCase();
  return q !== '' && name.toLowerCase().includes(q);
};

export function tripSeconds(trip: Pick<TripInfo, 'departure' | 'arrival'>): number {
  const span = trip.arrival - trip.departure;
  return span < 0 ? span + DAY : span;
}

export const startTime = (departure: number) => hhmm(departure - LEAD_SECONDS);

export interface StopClock {
  time: string;
  arrival: string | null;
}

export function stopClock(stop: StopInfo): StopClock {
  const arr = stop.arr >= 0 ? hhmm(stop.arr) : null;
  const dep = stop.dep >= 0 ? hhmm(stop.dep) : null;
  if (dep === null) return { time: arr ?? '–', arrival: null };
  return { time: dep, arrival: arr !== null && arr !== dep ? arr : null };
}

export const stopAt = (trip: TripInfo, query: string): StopInfo | undefined =>
  trip.stops.find((s) => s.dep >= 0 && matchesStop(s.name, query));

export interface Departure {
  line: LineInfo;
  tour: TourInfo;
  trip: TripInfo;
  time: number;
  stop: string | null;
}

const byLineName = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

export function departures(lines: LineInfo[], line: string, stop: string): Departure[] {
  const searching = stop.trim() !== '';
  const out: Departure[] = [];
  for (const l of lines) {
    if (line && l.name !== line) continue;
    for (const tour of l.tours) {
      if (!tour.runs) continue;
      for (const trip of tour.trips) {
        if (!searching) {
          out.push({ line: l, tour, trip, time: trip.departure, stop: null });
          continue;
        }
        const at = stopAt(trip, stop);
        if (at) out.push({ line: l, tour, trip, time: at.dep, stop: at.name });
      }
    }
  }
  return out.sort((a, b) => a.time - b.time || byLineName(a.line.name, b.line.name));
}

export function byHour<T extends { time: number }>(items: T[]): { hour: number; items: T[] }[] {
  const groups: { hour: number; items: T[] }[] = [];
  for (const item of items) {
    const hour = Math.floor(item.time / 3600);
    const last = groups[groups.length - 1];
    if (last?.hour === hour) last.items.push(item);
    else groups.push({ hour, items: [item] });
  }
  return groups;
}

export const hourLabel = (hour: number) => `${String(hour % 24).padStart(2, '0')}:00`;

export function parseClock(text: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(text.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 3600 + min * 60 : null;
}

export const firstAfter = (items: { time: number }[], seconds: number) =>
  items.findIndex((item) => item.time >= seconds);

export const sortTours = (tours: TourInfo[]) =>
  [...tours].sort(
    (a, b) => Number(a.number) - Number(b.number) || a.number.localeCompare(b.number),
  );

export const toursServing = (tours: TourInfo[], stop: string) =>
  stop.trim() ? tours.filter((tour) => tour.trips.some((trip) => stopAt(trip, stop))) : tours;

export function tourEnd(tour: TourInfo): number {
  const last = tour.trips[tour.trips.length - 1];
  return last ? last.departure + tripSeconds(last) : tour.last;
}

export function dayRange(lines: LineInfo[]): { start: number; end: number } {
  let start = Infinity;
  let end = -Infinity;
  for (const line of lines) {
    for (const tour of line.tours) {
      for (const trip of tour.trips) {
        start = Math.min(start, trip.departure);
        end = Math.max(end, trip.departure + tripSeconds(trip));
      }
    }
  }
  if (start > end) return { start: 0, end: DAY };
  return { start: Math.floor(start / 3600) * 3600, end: Math.ceil(end / 3600) * 3600 };
}

export function tourBlocks(
  tour: TourInfo,
  range: { start: number; end: number },
): { left: number; width: number }[] {
  const span = Math.max(1, range.end - range.start);
  return tour.trips.map((trip) => ({
    left: Math.max(0, (trip.departure - range.start) / span),
    width: Math.min(1, tripSeconds(trip) / span),
  }));
}

export function dutyPatch(
  current: Pick<Choice, 'map'>,
  pick: { map: string; date: string; line: LineInfo; tour: TourInfo; trip?: TripInfo },
): Partial<Choice> {
  const trip = pick.trip ?? pick.tour.trips[0];
  const patch: Partial<Choice> = {
    map: pick.map,
    free: false,
    line: pick.line.name,
    tour: pick.tour.number,
    trip: pick.trip ? String(pick.trip.index) : '',
    date: pick.tour.runs ? pick.date : (pick.tour.nextRun ?? pick.date),
    season: 'auto',
    entry: -1,
    stop: null,
  };
  if (trip) patch.time = startTime(trip.departure);
  if (current.map !== pick.map) patch.hof = '';
  return patch;
}

export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return todayIso(d);
}
