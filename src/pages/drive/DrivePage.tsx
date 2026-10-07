import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Notice, Spinner } from '../../components/ui';
import { t } from '../../i18n';
import { call, errorText, useCommand, useEngine } from '../../lib/engine';
import { seasonOf, toDuty, useDuty, type Choice } from '../../lib/duty';
import { duration, hhmm, lineLabel, longDate } from '../../lib/format';
import { useNav, useToast } from '../../lib/nav';
import type { LineInfo, MapInfo, TripInfo, VehicleInfo, WeatherInfo } from '../../types/launcher';
import { BusStep } from './BusStep';
import { BusViewer } from './BusViewer';
import { StopList } from './MapView';
import { Minimap, type MapPick } from './Minimap';
import { RoadbookStep } from './RoadbookStep';
import { RouteStep } from './RouteStep';
import { TimeStep, weatherIcon, weatherLabel } from './TimeStep';

const STEPS = ['bus', 'route', 'time', 'roadbook'] as const;
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
    <div className="stage relative m-3 ml-0 min-h-0 flex-1 overflow-hidden rounded-3xl">
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

function Stage({ data, view, onView }: { data: DriveData; view: View; onView: (v: View) => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const [reserve, setReserve] = useState(0);

  useEffect(() => {
    const el = panel.current!;
    const observer = new ResizeObserver(([e]) => setReserve(e.contentRect.width + 8));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Visual view={view} data={data} reserve={reserve} />
      <div
        ref={panel}
        className="absolute top-2 right-2 bottom-2 flex w-[clamp(25rem,28vw,34rem)] flex-col overflow-hidden rounded-[1.25rem] bg-page shadow-2xl"
      >
        {view === 'overview' ? (
          <Overview data={data} onView={onView} />
        ) : (
          <Flow step={view} data={data} onView={onView} />
        )}
      </div>
    </>
  );
}

function Visual({ view, data, reserve }: { view: View; data: DriveData; reserve: number }) {
  const { choice } = useDuty();
  const p = picked(data, choice);
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = host.current!;
    const observer = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const visible = Math.max(0, width - reserve);
  const centre = view === 'bus' || view === 'overview' ? visible * 0.5 : visible * 0.66;

  return (
    <div ref={host} className="absolute inset-0">
      <div
        className={`absolute inset-0 pt-24 pb-4 transition-opacity duration-500 ${
          view === 'route' ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {p.bus && (
          <BusViewer
            bus={p.bus.file}
            paint={choice.paint || p.bus.default_paint}
            centreX={centre}
          />
        )}
      </div>
      {view === 'route' ? (
        <RouteVisual data={data} p={p} reserve={reserve} />
      ) : view === 'time' ? (
        <TimeVisual data={data} />
      ) : view === 'roadbook' ? (
        <RoadbookVisual data={data} p={p} />
      ) : (
        <BusHeader p={p} />
      )}
    </div>
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

function BusHeader({ p }: { p: Picked }) {
  const { choice, update } = useDuty();
  const paints = p.bus?.paints ?? [];
  const paintIndex = Math.max(0, paints.indexOf(choice.paint));
  const cyclePaint = (delta: number) =>
    paints.length &&
    update({ paint: paints[(paintIndex + delta + paints.length) % paints.length] });
  return (
    <div className="legible pointer-events-none absolute top-0 left-0 max-w-[50%] px-12 pt-10">
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
    <div className="legible pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-center px-12">
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
    <div className="legible absolute inset-y-0 left-0 flex max-w-[34rem] flex-col px-12 pt-10 pb-10">
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

function RouteVisual({ data, p, reserve }: { data: DriveData; p: Picked; reserve: number }) {
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
            inset={{ top: 150, right: reserve + 32, bottom: 64, left: 48 }}
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
      <div className="legible pointer-events-none absolute top-0 left-0 max-w-[60%] px-12 pt-10">
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

const STEP_ICON: Record<Step, string> = {
  bus: 'directions_bus',
  route: 'route',
  time: 'schedule',
  roadbook: 'receipt_long',
};

function Stepper({ step, onView }: { step: Step; onView: (v: View) => void }) {
  const current = STEPS.indexOf(step);
  return (
    <ol className="grid grid-cols-2 gap-1">
      {STEPS.map((s, i) => (
        <li key={s} className="min-w-0">
          <button
            type="button"
            onClick={() => onView(s)}
            aria-current={i === current ? 'step' : undefined}
            className={`nav-link ${i === current ? 'on' : ''}`}
          >
            <Icon
              name={i < current ? 'check' : STEP_ICON[s]}
              size={18}
              color={i < current ? 'var(--accent)' : undefined}
            />
            <span className="truncate">{t(`drive.flow.${s}`)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function Flow({ step, data, onView }: { step: Step; data: DriveData; onView: (v: View) => void }) {
  const index = STEPS.indexOf(step);
  const last = index === STEPS.length - 1;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-6 pt-5">
        <div className="flex items-center gap-3.5">
          <Icon name={STEP_ICON[step]} size={30} color="var(--accent)" />
          <h2 className="min-w-0 flex-1 truncate font-display text-[1.45rem] leading-tight font-bold tracking-tight text-heading">
            {t(`drive.flow.titles.${step}`)}
          </h2>
          <button
            type="button"
            className="theme-toggle -mr-2 size-11 shrink-0 rounded-full"
            aria-label={t('drive.flow.toOverview')}
            title={t('drive.flow.toOverview')}
            onClick={() => onView('overview')}
          >
            <Icon name="close" size={26} />
          </button>
        </div>
        <div className="mt-4">
          <Stepper step={step} onView={onView} />
        </div>
      </div>
      <div key={step} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 pt-5 pb-6">
        {step === 'bus' ? (
          <BusStep data={data} />
        ) : step === 'route' ? (
          <RouteStep data={data} />
        ) : step === 'time' ? (
          <TimeStep data={data} />
        ) : (
          <RoadbookStep data={data} />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 px-6 pt-2 pb-6">
        <button
          type="button"
          className="btn-quiet h-12 gap-1.5 rounded-full pr-5 pl-4"
          onClick={() => onView(index === 0 ? 'overview' : STEPS[index - 1])}
        >
          <Icon name="chevron_left" size={18} />
          {index === 0 ? t('drive.flow.toOverview') : t('drive.flow.back')}
        </button>
        <button
          type="button"
          className="btn ml-auto h-12 gap-1.5 rounded-full pr-4 pl-6"
          onClick={() => onView(last ? 'overview' : STEPS[index + 1])}
        >
          {last ? t('drive.flow.done') : t(`drive.flow.next.${STEPS[index + 1]}`)}
          <Icon name={last ? 'check' : 'chevron_right'} size={18} />
        </button>
      </div>
    </div>
  );
}

function Overview({ data, onView }: { data: DriveData; onView: (v: View) => void }) {
  const { choice, server, setServer } = useDuty();
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

  const rows: [Step, string, string, string][] = [
    [
      'bus',
      'directions_bus',
      p.bus?.name ?? t('drive.summary.noBus'),
      choice.paint || p.bus?.default_paint || '',
    ],
    ['route', 'route', p.map?.friendly ?? '–', dutyLabel(choice, data, p)],
    [
      'time',
      'schedule',
      server ? t('drive.summary.serverClock') : `${choice.time} · ${longDate(choice.date)}`,
      server ? server.weather : weatherLabel(choice, data.weather),
    ],
    [
      'roadbook',
      'receipt_long',
      p.trip ? `${hhmm(p.trip.departure)} · ${p.trip.from}` : t('drive.roadbook.none'),
      p.trip ? `→ ${p.trip.terminus}` : '',
    ],
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-4">
        <h2 className="section-title text-[1.6rem]">{t('drive.flow.overviewTitle')}</h2>
        <ol className="mt-4 space-y-0.5">
          {rows.map(([step, icon, value, detail]) => (
            <li key={step}>
              <button
                type="button"
                onClick={() => onView(step)}
                className="group -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-sunken"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sunken text-muted transition-colors group-hover:text-accent">
                  <Icon name={icon} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-heading">{value}</span>
                  {detail && (
                    <span className="block truncate text-[14.5px] text-muted">{detail}</span>
                  )}
                </span>
                <Icon name="chevron_right" size={18} style={{ opacity: 0.4 }} />
              </button>
            </li>
          ))}
        </ol>

        {p.bus && p.bus.missing_packs.length > 0 && (
          <Notice
            tone="warning"
            icon="warning"
            title={t('drive.bus.partsMissing')}
            className="mt-5"
          >
            {p.bus.missing_packs.join(', ')}
          </Notice>
        )}
        {server && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <Icon name="dns" size={18} style={{ color: 'var(--accent)' }} />
            <span className="min-w-0 flex-1 truncate">{server.name}</span>
            <button type="button" className="code-action" onClick={() => setServer(null)}>
              <Icon name="logout" size={16} />
              {t('drive.summary.leave')}
            </button>
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-2.5 px-6 pt-2 pb-6">
        <button
          type="button"
          className="btn h-16 w-full justify-center rounded-full text-[19px]"
          disabled={starting}
          onClick={() => launch()}
        >
          {armed
            ? t('drive.start.another')
            : p.line
              ? t('drive.start.duty')
              : t('drive.start.drive')}
        </button>
        {situations.data && situations.data.length > 0 && (
          <button
            type="button"
            className="btn-quiet h-12 w-full justify-center gap-2 rounded-full"
            onClick={() => launch(situations.data![0].file)}
          >
            <Icon name="history" size={18} />
            {t('drive.start.continue')}
          </button>
        )}
        {running > 0 && (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 pt-1 text-[14.5px] text-muted hover:text-heading"
            onClick={() => go('sessions')}
          >
            <span className="size-2 rounded-full bg-ok" />
            {t('drive.start.running', { count: running })}
          </button>
        )}
      </div>
    </div>
  );
}
