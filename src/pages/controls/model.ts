import type {
  AxisFunction,
  Controller,
  ControllerAxis,
  KeyBinding,
  KeyBindings,
} from '../../types/launcher';
import { CHORD, KEY_HOLD } from './keys';

export type Group = keyof KeyBindings;
export type AxisShape = ControllerAxis['shape'];

export interface ActionRow {
  action: string;
  entries: number[];
}

export const keyId = (b: Pick<KeyBinding, 'scan_code' | 'modifier'>) =>
  `${b.scan_code}:${b.modifier & CHORD}`;

export function actionRows(list: KeyBinding[]): ActionRow[] {
  const rows = new Map<string, ActionRow>();
  list.forEach((b, i) => {
    const row = rows.get(b.action);
    if (row) row.entries.push(i);
    else rows.set(b.action, { action: b.action, entries: [i] });
  });
  return [...rows.values()];
}

export function conflicts(list: KeyBinding[]): Map<string, string[]> {
  const byKey = new Map<string, string[]>();
  for (const b of list) {
    if (!b.scan_code) continue;
    const id = keyId(b);
    const actions = byKey.get(id) ?? [];
    if (!actions.includes(b.action)) actions.push(b.action);
    byKey.set(id, actions);
  }
  for (const [id, actions] of byKey) if (actions.length < 2) byKey.delete(id);
  return byKey;
}

const holdOf = (list: KeyBinding[], action: string) =>
  list.find((b) => b.action === action)?.modifier ?? 0;

export function setKey(list: KeyBinding[], index: number, scan: number, chord: number) {
  return list.map((b, i) =>
    i === index
      ? { ...b, scan_code: scan, modifier: (chord & CHORD) | (b.modifier & KEY_HOLD) }
      : b,
  );
}

export function addKey(list: KeyBinding[], action: string, scan: number, chord: number) {
  const last = list.findLastIndex((b) => b.action === action);
  const entry = {
    action,
    scan_code: scan,
    modifier: (chord & CHORD) | (holdOf(list, action) & KEY_HOLD),
  };
  const at = last < 0 ? list.length : last + 1;
  return [...list.slice(0, at), entry, ...list.slice(at)];
}

export function unbind(list: KeyBinding[], index: number) {
  const action = list[index]?.action;
  if (action === undefined) return list;
  const others = list.some((b, i) => i !== index && b.action === action);
  if (others) return list.filter((_, i) => i !== index);
  return setKey(list, index, 0, 0);
}

const signature = (list: KeyBinding[]) => {
  const out = new Map<string, string>();
  for (const row of actionRows(list)) {
    const keys = row.entries
      .map((i) => list[i])
      .filter((b) => b.scan_code)
      .map(keyId)
      .sort();
    out.set(row.action, keys.join(','));
  }
  return out;
};

export function countChanges(before: KeyBindings, after: KeyBindings): number {
  let n = 0;
  for (const group of ['vehicles', 'game'] as const) {
    const a = signature(before[group] ?? []);
    const b = signature(after[group] ?? []);
    for (const action of new Set([...a.keys(), ...b.keys()])) {
      if ((a.get(action) ?? '') !== (b.get(action) ?? '') || a.has(action) !== b.has(action)) n++;
    }
  }
  return n;
}

const BIPOLAR = new Set<AxisFunction>(['', 'steering', 'throttle_brake', 'look_x', 'look_y']);

export const isBipolar = (f: AxisFunction) => BIPOLAR.has(f);

const bend = (shape: string, x: number) =>
  shape === 'progressive' ? x * x : shape === 'degressive' ? 1 - (1 - x) * (1 - x) : x;

export function curve(shape: AxisShape, x: number): number {
  if (!shape.startsWith('bi-')) return bend(shape, x);
  const t = 2 * x - 1;
  return (Math.sign(t) * bend(shape.slice(3), Math.abs(t)) + 1) / 2;
}

export function axisOutput(
  raw: number,
  axis: Pick<ControllerAxis, 'function' | 'reversed' | 'shape'>,
  deadzone: number,
): number {
  const v = Math.max(-1, Math.min(1, axis.reversed ? -raw : raw));
  if (isBipolar(axis.function)) {
    const m = Math.abs(v);
    if (m <= deadzone) return 0;
    const shape = axis.shape.startsWith('bi-') ? axis.shape.slice(3) : axis.shape;
    return Math.sign(v) * bend(shape, (m - deadzone) / (1 - deadzone));
  }
  const x = (v + 1) / 2;
  if (x <= deadzone) return 0;
  return curve(axis.shape, (x - deadzone) / (1 - deadzone));
}

export function controllerChanges(before: Controller[], after: Controller[]): number {
  let n = 0;
  after.forEach((c, i) => {
    const o = before[i];
    if (!o) return void n++;
    n += Number(o.enabled !== c.enabled);
    n += Number(o.deadzone !== c.deadzone);
    n += Number(o.force_feedback !== c.force_feedback);
    c.axes.forEach((a, j) => {
      const b = o.axes[j];
      n += Number(
        !b || b.function !== a.function || b.reversed !== a.reversed || b.shape !== a.shape,
      );
    });
    c.buttons.forEach(([, f], j) => {
      n += Number(o.buttons[j]?.[1] !== f);
    });
  });
  return n;
}
