import React, { useEffect, useRef, useState, type RefObject } from 'react';
import { Icon } from '../../components/Icon';
import { Notice, Spinner } from '../../components/ui';
import { t } from '../../i18n';
import { call, errorText, useCommand, useEngine } from '../../lib/engine';
import { seasonOf, toDuty, useDuty, type Choice } from '../../lib/duty';
import { contentName, duration, hhmm, lineLabel, longDate } from '../../lib/format';
import { useNav, useToast } from '../../lib/nav';
import type { LineInfo, MapInfo, TripInfo, VehicleInfo, WeatherInfo } from '../../types/launcher';
import { BusStep } from './BusStep';
import { BusViewer } from './BusViewer';
import { StopList } from './MapView';
import { Minimap, type MapPick } from './Minimap';
import { PassengerPromo } from './Promo';
import { RoadbookStep } from './RoadbookStep';
import { RouteStep } from './RouteStep';
import { TimeStep, weatherIcon, weatherLabel } from './TimeStep';

const STEPS = ['route', 'bus', 'time', 'roadbook'] as const;
type Step = (typeof STEPS)[number];
type View = Step | 'overview';

export interface DriveData {
  maps: MapInfo[];
  vehicles: VehicleInfo[];
  weather: WeatherInfo[];
  lines: LineInfo[] | undefined;
}

interface Picked {
  bus?: VehicleInfo;
  map?: MapInfo;
  line?: LineInfo;
  tour?: LineInfo['tours'][number];
  trip?: TripInfo;
}

const GAP = 16;

interface Frame {
  centreX: number;
  centreY: number;
  fit: number;
}

function useFrame(above: RefObject<HTMLElement | null>[], below: RefObject<HTMLElement | null>[]) {
  const [frame, setFrame] = useState<Frame | null>(null);
  useEffect(() => {
    const tops = above.map((r) => r.current).filter((el): el is HTMLElement => !!el);
    const host = tops[0]?.offsetParent as HTMLElement | null;
    if (!host) return;
    const blocks = below.map((r) => r.current).filter((el): el is HTMLElement => !!el);
    const measure = () => {
      const height = host.clientHeight;
      const top = Math.max(GAP, ...tops.map((el) => el.offsetTop + el.offsetHeight + GAP));
      const bottom = Math.min(height - GAP * 2, ...blocks.map((el) => el.offsetTop - GAP));
      setFrame({
        centreX: host.clientWidth / 2,
        centreY: (top + bottom) / 2,
        fit: Math.max(0.2, (bottom - top) / height),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const el of [host, ...tops, ...blocks]) observer.observe(el);
    return () => observer.disconnect();
  }, [...above, ...below]);
  return frame;
}

function Showroom({
  p,
  above = [],
  below = [],
  hidden,
}: {
  p: Picked;
  above?: RefObject<HTMLElement | null>[];
  below?: RefObject<HTMLElement | null>[];
  hidden?: boolean;
}) {
  const { choice } = useDuty();
  const header = useRef<HTMLDivElement>(null);
  const frame = useFrame([header, ...above], below);
  return (
    <>
      {frame && p.bus && !hidden && (
        <div className="absolute inset-0">
          <BusViewer bus={p.bus.file} paint={choice.paint || p.bus.default_paint} {...frame} />
        </div>
      )}
      <BusHeader p={p} ref={header} />
    </>
  );
}

function picked(data: DriveData, choice: Choice): Picked {
  const line = choice.free ? undefined : data.lines?.find((l) => l.name === choice.line);
  const tour = line?.tours.find((tr) => tr.number === choice.tour);
  return {
    bus: data.vehicles.find((v) => v.file === choice.bus),
    map: data.maps.find((m) => m.file === choice.map),
    line,
    tour,
    trip: tour?.trips[choice.trip === '' ? 0 : Number(choice.trip)] ?? tour?.trips[0],
  };
}

function dutyLabel(choice: Choice, data: DriveData, p: Picked) {
  if (!p.line) {
    if (choice.free) return t('drive.summary.freeDrive');
    return data.lines ? t('drive.summary.noLine') : t('drive.route.readingTimetable');
  }
  return p.tour
    ? t('drive.summary.lineTour', { line: lineLabel(p.line.name), tour: p.tour.number })
    : t('drive.summary.lineOnly', { line: lineLabel(p.line.name) });
}

export const DrivePage: React.FC = () => {
  const [view, setView] = useState<View>('overview');
  const { choice, update } = useDuty();
  const maps = useCommand('maps');
  const vehicles = useCommand('vehicles');
  const weather = useCommand('weather');
  const lines = useCommand('lines', choice.map ? { map: choice.map, date: choice.date } : null);

  useEffect(() => {
    if (!vehicles.data?.length || !maps.data?.length) return;
    const patch: Partial<Choice> = {};
    const bus = vehicles.data.find((v) => v.file === choice.bus) ?? vehicles.data[0];
    if (bus.file !== choice.bus) Object.assign(patch, { bus: bus.file, paint: bus.default_paint });
    if (!maps.data.some((m) => m.file === choice.map)) {
      Object.assign(patch, { map: maps.data[0].file, line: '', tour: '', trip: '', stop: null });
    }
    if (Object.keys(patch).length) update(patch);
  }, [vehicles.data, maps.data]);

  useEffect(() => {
    if (choice.free || choice.line || !lines.data?.length) return;
    const line = lines.data.find((l) => l.user_allowed && l.tours.some((tr) => tr.runs));
    const tour = line?.tours.find((tr) => tr.runs);
    if (line && tour) update({ line: line.name, tour: tour.number, trip: '' });
  }, [lines.data, choice.free]);

  useEffect(() => {
    if (view === 'overview') return;
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setView('overview');
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [view]);

  const error = maps.error || vehicles.error || weather.error;
  const data: DriveData | null =
    maps.data && vehicles.data && weather.data
      ? { maps: maps.data, vehicles: vehicles.data, weather: weather.data, lines: lines.data }
      : null;

  return (
    <div className="stage relative mr-3 mb-3 min-h-0 flex-1 overflow-hidden rounded-3xl">
      {error ? (
        <div className="p-12">
          <Notice tone="caution" icon="error" title={t('drive.loadFailed')}>
            {error}
          </Notice>
        </div>
      ) : !data ? (
        <div className="p-12">
          <Spinner label={t('drive.reading')} />
        </div>
      ) : (
        <Stage data={data} view={view} onView={setView} />
      )}
    </div>
  );
};

const STEP_ICON: Record<Step, string> = {
  route: 'route',
  bus: 'directions_bus',
  time: 'schedule',
  roadbook: 'receipt_long',
};

function Stage({ data, view, onView }: { data: DriveData; view: View; onView: (v: View) => void }) {
  const [shown, setShown] = useState<Step | null>(null);
  const open = view !== 'overview';

  useEffect(() => {
    if (view !== 'overview') setShown(view);
  }, [view]);

  return (
    <>
      <div {...(open ? { inert: true } : {})} className="absolute inset-0">
        <Home data={data} open={open} onView={onView} />
      </div>
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-[color-mix(in_srgb,var(--page)_45%,transparent)] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => onView('overview')}
      />
      <div
        role="dialog"
        aria-modal={open}
        className={`absolute inset-3 flex flex-col overflow-hidden rounded-[1.25rem] bg-page shadow-2xl transition-[transform,opacity] duration-300 ease-out ${
          open ? '' : 'pointer-events-none scale-[0.97] opacity-0'
        }`}
        {...(open ? {} : { inert: true })}
      >
        {shown && <Sheet step={shown} data={data} onView={onView} />}
      </div>
    </>
  );
}

function Home({
  data,
  open,
  onView,
}: {
  data: DriveData;
  open: boolean;
  onView: (v: View) => void;
}) {
  const { choice, server, setServer } = useDuty();
  const promo = useRef<HTMLDivElement>(null);
  const side = useRef<HTMLDivElement>(null);
  const plan = useRef<HTMLDivElement>(null);
  const p = picked(data, choice);
  const rows: [Step, string, string][] = [
    ['route', p.map?.friendly ?? '–', dutyLabel(choice, data, p)],
    ['bus', p.bus?.name ?? t('drive.summary.noBus'), choice.paint || p.bus?.default_paint || ''],
    [
      'time',
      server ? t('drive.summary.serverClock') : `${choice.time} · ${longDate(choice.date)}`,
      server ? server.weather : weatherLabel(choice, data.weather),
    ],
    [
      'roadbook',
      p.trip ? `${hhmm(p.trip.departure)} ${p.trip.from}` : t('drive.roadbook.none'),
      p.trip ? `→ ${p.trip.terminus}` : '',
    ],
  ];

  return (
    <>
      <Showroom p={p} above={[promo]} below={[plan, side]} hidden={open} />
      <div ref={promo} className="absolute top-8 right-8 w-[19.5rem]">
        <PassengerPromo />
      </div>

      <div ref={plan} className="absolute bottom-8 left-9 w-[min(40rem,calc(100%-24rem))]">
        {p.bus && p.bus.missing_packs.length > 0 && (
          <p className="mb-3 flex items-center gap-2.5 text-[15px]">
            <Icon name="warning" size={20} style={{ color: 'var(--color-warn)', flexShrink: 0 }} />
            <span className="truncate">
              <span className="font-semibold text-heading">{t('drive.bus.partsMissing')}</span>
              <span className="text-muted"> · {p.bus.missing_packs.join(', ')}</span>
            </span>
          </p>
        )}
        {server && (
          <p className="mb-3 flex items-center gap-2.5 text-[15px]">
            <Icon name="dns" size={20} style={{ color: 'var(--accent)' }} />
            <span className="min-w-0 truncate text-heading">{server.name}</span>
            <button type="button" className="code-action" onClick={() => setServer(null)}>
              <Icon name="logout" size={16} />
              {t('drive.summary.leave')}
            </button>
          </p>
        )}
        <ol className="-mx-3">
          {rows.map(([step, value, detail]) => (
            <li key={step}>
              <button
                type="button"
                onClick={() => onView(step)}
                className="group flex h-14 w-full items-center gap-4 rounded-xl px-3 text-left transition-colors hover:bg-page/70"
              >
                <span className="text-accent">
                  <Icon name={STEP_ICON[step]} size={24} />
                </span>
                <span className="w-32 shrink-0 text-[14.5px] text-muted">
                  {t(`drive.flow.${step}`)}
                </span>
                <span className="flex min-w-0 flex-1 items-baseline gap-3">
                  <span className="truncate font-display text-[1.15rem] font-semibold text-heading">
                    {value}
                  </span>
                  {detail && <span className="truncate text-[14.5px] text-muted">{detail}</span>}
                </span>
                <span className="text-muted opacity-0 transition-opacity group-hover:opacity-100">
                  <Icon name="chevron_right" size={22} />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div ref={side} className="absolute right-9 bottom-8 flex w-[18rem] flex-col items-stretch">
        <Launch data={data} />
      </div>
    </>
  );
}

function Sheet({ step, data, onView }: { step: Step; data: DriveData; onView: (v: View) => void }) {
  const { choice } = useDuty();
  const p = picked(data, choice);
  const index = STEPS.indexOf(step);
  const next = STEPS[index + 1];

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-1 pr-3 pl-4">
        <nav aria-label={t('drive.flow.overviewTitle')} className="flex min-w-0 flex-1 gap-1">
          {STEPS.map((s) => (
            <button
              key={s}
              type="button"
              aria-current={s === step ? 'step' : undefined}
              onClick={() => onView(s)}
              className={`flex h-10 items-center gap-2.5 rounded-full px-4 text-[15px] font-medium transition-colors ${
                s === step ? 'bg-sunken text-heading' : 'text-muted hover:text-ink'
              }`}
            >
              <span className={s === step ? 'text-accent' : ''}>
                <Icon name={STEP_ICON[s]} size={20} />
              </span>
              {t(`drive.flow.${s}`)}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="theme-toggle size-10 shrink-0 rounded-full"
          aria-label={t('drive.flow.close')}
          title={t('drive.flow.close')}
          onClick={() => onView('overview')}
        >
          <Icon name="close" size={22} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3">
        <div className="flex w-[clamp(25.5rem,38%,30rem)] shrink-0 flex-col">
          <div
            key={step}
            className="rise min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pt-4 pb-4"
          >
            <h2 className="mb-6 font-display text-[1.6rem] leading-tight font-bold tracking-tight text-heading">
              {t(`drive.flow.titles.${step}`)}
            </h2>
            {step === 'route' ? (
              <RouteStep data={data} />
            ) : step === 'bus' ? (
              <BusStep data={data} />
            ) : step === 'time' ? (
              <TimeStep data={data} />
            ) : (
              <RoadbookStep data={data} />
            )}
          </div>
          <div className="shrink-0 px-5 pt-3 pb-3">
            <button
              type="button"
              className="btn h-12 w-full justify-center gap-2 rounded-full"
              onClick={() => onView(next ?? 'overview')}
            >
              {next
                ? t('drive.flow.next', { step: t(`drive.flow.${next}`) })
                : t('drive.flow.done')}
              {next && <Icon name="arrow_forward" size={20} />}
            </button>
          </div>
        </div>

        <div className="stage relative min-w-0 flex-1 overflow-hidden rounded-2xl">
          {step === 'route' ? (
            <RouteVisual data={data} p={p} />
          ) : step === 'bus' ? (
            <Showroom p={p} />
          ) : step === 'time' ? (
            <TimeVisual data={data} />
          ) : (
            <RoadbookVisual data={data} p={p} />
          )}
        </div>
      </div>
    </>
  );
}

function Heading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <>
      <h2 className="mt-1 truncate font-display text-[2.6rem] leading-tight font-bold tracking-tight">
        {title}
      </h2>
      {children && <div className="mt-1 text-[17px] text-muted">{children}</div>}
    </>
  );
}

function BusHeader({ p, ref }: { p: Picked; ref?: React.Ref<HTMLDivElement> }) {
  const { choice, update } = useDuty();
  const paints = p.bus?.paints ?? [];
  const paintIndex = Math.max(0, paints.indexOf(choice.paint));
  const cyclePaint = (delta: number) =>
    paints.length &&
    update({ paint: paints[(paintIndex + delta + paints.length) % paints.length] });
  return (
    <div
      ref={ref}
      className="legible pointer-events-none absolute top-0 left-0 max-w-[85%] px-10 pt-9"
    >
      <Heading title={p.bus?.name ?? t('drive.summary.noBus')} />
      <div className="pointer-events-auto mt-1 flex w-fit items-center gap-1 text-[17px] text-muted">
        {paints.length > 1 && (
          <button
            type="button"
            className="theme-toggle -ml-2 size-8"
            aria-label={t('drive.bus.prevLivery')}
            onClick={() => cyclePaint(-1)}
          >
            <Icon name="chevron_left" size={20} />
          </button>
        )}
        <span className="truncate">{choice.paint || p.bus?.default_paint}</span>
        {paints.length > 1 && (
          <button
            type="button"
            className="theme-toggle size-8"
            aria-label={t('drive.bus.nextLivery')}
            onClick={() => cyclePaint(1)}
          >
            <Icon name="chevron_right" size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

function TimeVisual({ data }: { data: DriveData }) {
  const { choice } = useDuty();
  return (
    <div className="legible pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-center px-10">
      <p className="font-display text-[7rem] leading-none font-bold tracking-tight text-heading tabular-nums">
        {choice.time}
      </p>
      <p className="mt-5 text-[22px] text-ink">
        {longDate(choice.date)} · {t(`drive.time.seasons.${seasonOf(choice)}`)}
      </p>
      <p className="mt-8 flex items-center gap-3 text-[18px] text-muted">
        <Icon
          name={weatherIcon(choice, data.weather)}
          size={26}
          style={{ color: 'var(--accent)' }}
        />
        {weatherLabel(choice, data.weather)}
      </p>
    </div>
  );
}

function RoadbookVisual({ data, p }: { data: DriveData; p: Picked }) {
  const { choice } = useDuty();
  const stops = (p.trip?.stops ?? []).map((s) => ({
    name: s.name,
    time: hhmm(s.dep >= 0 ? s.dep : s.arr),
  }));
  return (
    <div className="legible absolute inset-y-0 left-0 flex max-w-[34rem] flex-col px-10 pt-9 pb-8">
      <Heading title={p.map?.friendly ?? '–'}>
        {dutyLabel(choice, data, p)}
        {p.tour && ` · ${hhmm(p.tour.first)} – ${hhmm(p.tour.last)}`}
      </Heading>
      <div className="mt-10 flex min-h-0 flex-1 flex-col">
        {p.trip ? (
          <>
            <p className="text-[17px] font-medium text-heading">
              {p.trip.from} → {p.trip.terminus}
            </p>
            <p className="mt-0.5 mb-6 text-muted">
              {hhmm(p.trip.departure)}–{hhmm(p.trip.arrival)} ·{' '}
              {duration(p.trip.arrival - p.trip.departure)} · {p.trip.km.toFixed(1)} km
            </p>
            <StopList stops={stops} />
          </>
        ) : (
          <p className="text-muted">{t('drive.roadbook.noneHint')}</p>
        )}
      </div>
    </div>
  );
}

function RouteVisual({ data, p }: { data: DriveData; p: Picked }) {
  const { choice, update } = useDuty();
  const minimap = useCommand('minimap', choice.map ? { map: choice.map } : null);
  const pick: MapPick = choice.stop
    ? { kind: 'stop', id: choice.stop.id }
    : choice.entry >= 0
      ? { kind: 'entry', index: choice.entry }
      : { kind: 'auto' };
  const start = choice.stop
    ? t('drive.route.stopStart', { name: choice.stop.name })
    : choice.entry >= 0
      ? (p.map?.entry_points.find((e) => e.index === choice.entry)?.name ?? '')
      : choice.free
        ? t('drive.route.autoFirst')
        : t('drive.route.autoNearest');

  return (
    <>
      <div className="absolute inset-0">
        {minimap.data ? (
          <Minimap
            data={minimap.data}
            route={(p.trip?.stops ?? []).map((s) => s.name)}
            trip={p.trip?.name}
            pick={pick}
            inset={{ top: 140, right: 32, bottom: 48, left: 48 }}
            onPickStop={(s) =>
              update({ stop: { id: s.id, name: s.name, spawn: s.spawn }, entry: -1 })
            }
            onPickEntry={(e) => update({ entry: e.index, stop: null })}
          />
        ) : minimap.error ? (
          <p className="px-12 pt-40 text-muted">{minimap.error}</p>
        ) : (
          <div className="px-12 pt-40">
            <Spinner label={t('drive.minimap.loading')} />
          </div>
        )}
      </div>
      <div className="legible pointer-events-none absolute top-0 left-0 max-w-[90%] px-10 pt-9">
        <Heading title={p.map?.friendly ?? '–'}>
          <span className="flex items-center gap-2">
            <span className="truncate">{dutyLabel(choice, data, p)}</span>
            <span aria-hidden="true">·</span>
            <Icon name="location_on" size={18} style={{ color: 'var(--accent)' }} />
            <span className="truncate">{start}</span>
          </span>
        </Heading>
      </div>
    </>
  );
}

function Launch({ data }: { data: DriveData }) {
  const { choice, server } = useDuty();
  const { instances, refreshInstances } = useEngine();
  const { go } = useNav();
  const toast = useToast();
  const config = useCommand('config');
  const situations = useCommand('situations', choice.map && !server ? { map: choice.map } : null);
  const [armed, setArmed] = useState(false);
  const [starting, setStarting] = useState(false);
  const disarm = useRef<ReturnType<typeof setTimeout>>(undefined);
  const p = picked(data, choice);
  const running = instances.filter((i) => i.running).length;

  const launch = async (situation?: string) => {
    if (!choice.bus || !choice.map) {
      toast(t('drive.start.chooseFirst'), 'caution');
      return;
    }
    if (running > 0 && !armed && !situation) {
      setArmed(true);
      clearTimeout(disarm.current);
      disarm.current = setTimeout(() => setArmed(false), 6000);
      toast(t('drive.start.alreadyRunning'));
      return;
    }
    setArmed(false);
    setStarting(true);
    try {
      const args = toDuty(choice, config.data?.profile ?? '', server);
      if (situation) Object.assign(args, { situation, lan: 'off' });
      const res = await call('launch', args);
      toast(t('drive.start.started', { pid: res.pid }), 'tip');
      refreshInstances();
      if (server) go('sessions');
    } catch (err) {
      toast(errorText(err), 'caution');
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      {situations.data && situations.data.length > 0 && (
        <button
          type="button"
          className="mb-2 flex items-center justify-center gap-2 py-1.5 text-[15px] font-medium text-muted transition-colors hover:text-ink"
          onClick={() => launch(situations.data![0].file)}
        >
          <Icon name="history" size={18} />
          {t('drive.start.continue')}
        </button>
      )}
      <button
        type="button"
        className="btn h-16 justify-center rounded-full text-[19px]"
        disabled={starting}
        onClick={() => launch()}
      >
        {armed ? t('drive.start.another') : p.line ? t('drive.start.duty') : t('drive.start.drive')}
      </button>
    </>
  );
}
