import type { Tutorial } from '../../types/launcher';

export type Block = { kind: 'p'; text: string } | { kind: 'list'; items: string[] };

const BULLET = /^\s*[•·\-*]\s+/;

export function blocks(text: string): Block[] {
  const out: Block[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (BULLET.test(line)) {
      const item = line.replace(BULLET, '');
      const last = out[out.length - 1];
      if (last?.kind === 'list') last.items.push(item);
      else out.push({ kind: 'list', items: [item] });
    } else {
      out.push({ kind: 'p', text: line });
    }
  }
  return out;
}

export function excerpt(text: string, max = 200): string {
  const first = blocks(text)[0];
  const lead = !first ? '' : first.kind === 'p' ? first.text : first.items.join(' · ');
  if (lead.length <= max) return lead;
  const cut = lead.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, '')}…`;
}

export type Starts = Record<number, number>;

const KEY = 'neoomsi.tutorials.started';

export function readStarts(): Starts {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

export function markStarted(n: number, at = Math.floor(Date.now() / 1000)): Starts {
  const next = { ...readStarts(), [n]: at };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export const nextLesson = (tutorials: Tutorial[], starts: Starts) =>
  [...tutorials].sort((a, b) => a.number - b.number).find((tut) => !starts[tut.number]);
