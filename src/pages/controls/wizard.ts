import { AxisFunction, type AxisCalibration } from '../../types/launcher';

export type Axes = (number | undefined)[];
export type Found = { function: AxisFunction; reversed: boolean } | undefined;

export const ASSIST_STEPS = ['rest', 'steering', 'throttle', 'brake', 'clutch'] as const;

export const MIN_SPAN = 0.2;

export function movedMost(
  rest: Axes,
  now: Axes,
  exclude: number[] = [],
): [number, number] | undefined {
  let best: [number, number] | undefined;
  now.forEach((v, k) => {
    if (v === undefined || exclude.includes(k)) return;
    const d = v - (rest[k] ?? 0);
    if (Math.abs(d) > 0.33 && (!best || Math.abs(d) > Math.abs(best[1]))) best = [k, d];
  });
  return best;
}

export function assistResult(rest: Axes, held: Axes[]): Found[] {
  const axes: Found[] = Array.from({ length: Math.max(rest.length, 8) }, () => undefined);
  const steer = held[0] && movedMost(rest, held[0]);
  if (steer) axes[steer[0]] = { function: AxisFunction.STEERING, reversed: steer[1] > 0 };
  const taken = steer ? [steer[0]] : [];
  const pedal = (i: number, exclude: number[]) => held[i] && movedMost(rest, held[i], exclude);
  const throttle = pedal(1, taken);
  const brake = pedal(2, taken);
  if (throttle && brake && throttle[0] === brake[0] && throttle[1] * brake[1] < 0) {
    axes[throttle[0]] = { function: AxisFunction.THROTTLE_BRAKE, reversed: throttle[1] < 0 };
  } else {
    if (throttle)
      axes[throttle[0]] = { function: AxisFunction.THROTTLE, reversed: throttle[1] < 0 };
    if (brake && brake[0] !== throttle?.[0]) {
      axes[brake[0]] = { function: AxisFunction.BRAKE, reversed: brake[1] < 0 };
    }
  }
  const clutch = pedal(3, [...taken, ...[throttle, brake].flatMap((p) => (p ? [p[0]] : []))]);
  if (clutch) axes[clutch[0]] = { function: AxisFunction.CLUTCH, reversed: clutch[1] < 0 };
  return axes;
}

/** Whether a press of Next found something: an axis not taken before moved far enough. */
export function stepMoved(rest: Axes, held: Axes[], now: Axes, step: number): boolean {
  const used = held.flatMap((a) => {
    const m = movedMost(rest, a);
    return m ? [m[0]] : [];
  });
  // (the throttle's axis may be the brake's too)
  return movedMost(rest, now, step === 3 ? used.slice(0, 1) : used) !== undefined;
}

export function calibrated(cal: AxisCalibration | undefined, v: number): number {
  if (!cal) return v;
  const lo = Math.min(cal.min, cal.max);
  const hi = Math.max(cal.min, cal.max);
  if (hi - lo < MIN_SPAN) return v;
  const c = cal.centre;
  const out =
    c !== undefined && c > lo + (hi - lo) * 0.1 && c < hi - (hi - lo) * 0.1
      ? v < c
        ? (v - c) / (c - lo)
        : (v - c) / (hi - c)
      : ((v - lo) / (hi - lo)) * 2 - 1;
  return Math.max(-1, Math.min(1, out));
}

export interface Seen {
  lo?: number;
  hi?: number;
  centre?: number;
  cleared?: boolean;
}

export function mergedCalibration(
  old: AxisCalibration | undefined,
  seen: Seen,
): Pick<AxisCalibration, 'min' | 'max' | 'centre' | 'deadzone'> | undefined {
  const base = seen.cleared ? undefined : old;
  const [min, max] =
    seen.lo !== undefined && seen.hi !== undefined && seen.hi - seen.lo >= MIN_SPAN
      ? [seen.lo, seen.hi]
      : [base?.min ?? -1, base?.max ?? 1];
  const centre = seen.centre ?? base?.centre;
  const deadzone = base?.deadzone;
  return min !== -1 || max !== 1 || centre !== undefined || deadzone !== undefined
    ? { min, max, centre, deadzone }
    : undefined;
}
