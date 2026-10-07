import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, iconPath } from '../../components/Icon';
import { t } from '../../i18n';
import type { Minimap as MinimapData, MinimapPlace } from '../../types/launcher';

type Box = [number, number, number, number];

export type MapPick =
  { kind: 'auto' } | { kind: 'entry'; index: number } | { kind: 'stop'; id: number };

function bounds(points: [number, number][], pad: number): Box | null {
  if (points.length === 0) return null;
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of points) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, -y);
    y1 = Math.max(y1, -y);
  }
  const w = Math.max(x1 - x0, 200) + pad * 2;
  const h = Math.max(y1 - y0, 200) + pad * 2;
  return [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h];
}

function fitTo(box: Box, aspect: number): Box {
  const [x, y, w, h] = box;
  if (w / h > aspect) {
    const nh = w / aspect;
    return [x, y - (nh - h) / 2, w, nh];
  }
  const nw = h * aspect;
  return [x - (nw - w) / 2, y, nw, h];
}

function pathOf(roads: MinimapData['roads'], main: boolean) {
  return roads
    .filter((r) => r.main === main)
    .map((r) => r.points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${-y}`).join(''))
    .join('');
}

function routePath(data: MinimapData, trip: string | undefined) {
  const ids = trip ? (data.trips?.[trip] ?? []) : [];
  const lanes = ids.map((i) => data.lanes?.[i] ?? []);
  let d = '';
  let end: [number, number] | null = null;
  for (const lane of lanes) {
    if (lane.length < 2) continue;
    const [sx, sy] = lane[0];
    const joined = end && Math.hypot(end[0] - sx, end[1] - sy) < 6;
    d += lane.map(([x, y], i) => `${i === 0 && !joined ? 'M' : 'L'}${x} ${-y}`).join('');
    end = lane[lane.length - 1];
  }
  return { d, points: lanes.flat() };
}

const spawnPoint = (place: MinimapPlace): [number, number] => {
  const [x, y] = place.spawn.split(',').map(Number);
  return [x, y];
};

export const Minimap: React.FC<{
  data: MinimapData;
  route: string[];
  trip?: string;
  pick: MapPick;
  inset: { top: number; right: number; bottom: number; left: number };
  onPickStop: (stop: MinimapData['stops'][number]) => void;
  onPickEntry: (entry: MinimapData['entries'][number]) => void;
}> = ({ data, route, trip, pick, inset, onPickStop, onPickEntry }) => {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [view, setView] = useState<Box | null>(null);
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null);
  const drag = useRef<{ x: number; y: number; box: Box; moved: boolean } | null>(null);

  const minor = useMemo(() => pathOf(data.roads, false), [data]);
  const main = useMemo(() => pathOf(data.roads, true), [data]);
  const routeStops = useMemo(
    () =>
      route
        .map((name) => data.stops.find((s) => s.name === name))
        .filter((s): s is MinimapData['stops'][number] => Boolean(s)),
    [data, route],
  );

  const path = useMemo(() => routePath(data, trip), [data, trip]);

  const home = useMemo<Box>(() => {
    const focus = [...routeStops.map((s) => [s.x, s.y] as [number, number]), ...path.points];
    const all = data.roads.flatMap((r) => r.points);
    return (
      bounds(focus.length > 1 ? focus : all, focus.length > 1 ? 260 : 60) ?? [
        -500, -500, 1000, 1000,
      ]
    );
  }, [data, routeStops, path]);

  useEffect(() => {
    const el = host.current!;
    const observer = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width || 1, h: e.contentRect.height || 1 }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => setView(null), [home]);

  const visibleW = Math.max(120, size.w - inset.left - inset.right);
  const visibleH = Math.max(120, size.h - inset.top - inset.bottom);
  const fitted = fitTo(home, visibleW / visibleH);
  const scale = fitted[2] / visibleW;
  const box: Box = view ?? [
    fitted[0] - inset.left * scale,
    fitted[1] - inset.top * scale,
    size.w * scale,
    size.h * scale,
  ];
  const px = box[2] / size.w;

  const toMap = (clientX: number, clientY: number) => {
    const r = host.current!.getBoundingClientRect();
    return [box[0] + (clientX - r.left) * px, box[1] + (clientY - r.top) * px];
  };

  const onWheel = (e: React.WheelEvent) => {
    const k = Math.exp(e.deltaY * 0.0015);
    const [mx, my] = toMap(e.clientX, e.clientY);
    const w = Math.min(Math.max(box[2] * k, 80), home[2] * 6);
    const f = w / box[2];
    setView([mx - (mx - box[0]) * f, my - (my - box[1]) * f, w, box[3] * f]);
  };

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, box, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    if (d.moved) setView([d.box[0] - dx * px, d.box[1] - dy * px, d.box[2], d.box[3]]);
  };
  const clicked = () => {
    const d = drag.current;
    drag.current = null;
    return !d?.moved;
  };

  const chosenStop = pick.kind === 'stop' ? data.stops.find((s) => s.id === pick.id) : undefined;
  const chosenEntry =
    pick.kind === 'entry' ? data.entries.find((e) => e.index === pick.index) : undefined;
  const marker = chosenStop ? spawnPoint(chosenStop) : chosenEntry ? spawnPoint(chosenEntry) : null;
  const onRoute = new Set(routeStops.map((s) => s.id));
  const bus = iconPath('directions_bus');

  return (
    <div className="relative size-full">
      <div
        ref={host}
        className="size-full cursor-grab touch-none select-none active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => setTimeout(() => (drag.current = null))}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={box.join(' ')} className="size-full">
          <path
            d={minor}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={main}
            fill="none"
            stroke="var(--muted)"
            strokeOpacity={0.55}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {(path.d || routeStops.length > 1) && (
            <path
              d={path.d || routeStops.map((s, i) => `${i ? 'L' : 'M'}${s.x} ${-s.y}`).join('')}
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {data.entries.map((e) => (
            <rect
              key={`e${e.index}`}
              x={e.x - 6 * px}
              y={-e.y - 6 * px}
              width={12 * px}
              height={12 * px}
              rx={3 * px}
              className="cursor-pointer"
              fill={chosenEntry === e ? 'var(--color-brand)' : 'var(--page)'}
              stroke={chosenEntry === e ? 'var(--color-brand)' : 'var(--ink)'}
              strokeWidth={2 * px}
              onPointerEnter={() => setHover({ name: e.name, x: e.x, y: e.y })}
              onPointerLeave={() => setHover(null)}
              onClick={() => clicked() && onPickEntry(e)}
            />
          ))}
          {data.stops.map((s) => {
            const route = onRoute.has(s.id);
            const chosen = chosenStop?.id === s.id;
            return (
              <circle
                key={`s${s.id}`}
                cx={s.x}
                cy={-s.y}
                r={(route || chosen ? 6 : 4.5) * px}
                className="cursor-pointer"
                fill={chosen || route ? 'var(--color-brand)' : 'var(--page)'}
                stroke={chosen || route ? 'var(--page)' : 'var(--heading)'}
                strokeWidth={2 * px}
                onPointerEnter={() => setHover({ name: s.name, x: s.x, y: s.y })}
                onPointerLeave={() => setHover(null)}
                onClick={() => clicked() && onPickStop(s)}
              />
            );
          })}
          {routeStops.map((s, i) => (
            <text
              key={`l${s.id}-${i}`}
              x={s.x + 10 * px}
              y={-s.y + 4.5 * px}
              fontSize={13 * px}
              fontWeight={600}
              fill="var(--heading)"
              stroke="var(--page)"
              strokeWidth={3.5 * px}
              paintOrder="stroke"
              fontFamily="var(--font-sans)"
              className="pointer-events-none"
            >
              {s.name}
            </text>
          ))}
          {marker && bus && (
            <g
              transform={`translate(${marker[0]} ${-marker[1]}) scale(${px})`}
              className="pointer-events-none"
            >
              <circle r={17} fill="var(--color-brand)" stroke="var(--page)" strokeWidth={3} />
              <svg x={-11} y={-11} width={22} height={22} viewBox="0 -960 960 960">
                <path d={bus} fill="var(--color-night)" />
              </svg>
            </g>
          )}
        </svg>
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md bg-raised px-2.5 py-1 text-[13.5px] whitespace-nowrap text-heading shadow-lg"
          style={{ left: (hover.x - box[0]) / px, top: (-hover.y - box[1]) / px - 12 }}
        >
          {hover.name}
        </div>
      )}

      <div
        className="legible absolute flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-muted"
        style={{ left: inset.left, bottom: 20 }}
      >
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-sunken hover:text-ink"
          onClick={() => setView(null)}
        >
          <Icon name="my_location" size={16} />
          {t('drive.minimap.fit')}
        </button>
      </div>
    </div>
  );
};
