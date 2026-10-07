import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Notice, Spinner } from '../../components/ui';
import { t } from '../../i18n';
import { call, errorText, useCommand, useEngine } from '../../lib/engine';
import { toDuty, useDuty } from '../../lib/duty';
import { hhmm, lineLabel, longDate } from '../../lib/format';
import { useNav, useToast } from '../../lib/nav';
import type { LineInfo, MapInfo, VehicleInfo, WeatherInfo } from '../../types/launcher';
import { BusStep } from './BusStep';
import { RouteStep } from './RouteStep';
import { TimeStep, weatherLabel } from './TimeStep';
import { BusViewer } from './BusViewer';
import { MapBackdrop, StopList, type StopRow } from './MapView';

type Picker = 'bus' | 'route' | 'time';

export interface DriveData {
  maps: MapInfo[];
  vehicles: VehicleInfo[];
  weather: WeatherInfo[];
  lines: LineInfo[] | undefined;
}

export const DrivePage: React.FC = () => {
  const [picker, setPicker] = useState<Picker | null>(null);
  const { choice, update } = useDuty();
  const maps = useCommand('maps');
  const vehicles = useCommand('vehicles');
  const weather = useCommand('weather');
  const lines = useCommand('lines', choice.map ? { map: choice.map, date: choice.date } : null);

  useEffect(() => {
    if (!vehicles.data?.length || !maps.data?.length) return;
    const patch: Partial<typeof choice> = {};
    const bus = vehicles.data.find((v) => v.file === choice.bus) ?? vehicles.data[0];
    if (bus.file !== choice.bus) Object.assign(patch, { bus: bus.file, paint: bus.default_paint });
    if (!maps.data.some((m) => m.file === choice.map)) {
      Object.assign(patch, { map: maps.data[0].file, line: '', tour: '', trip: '' });
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
    if (!picker) return;
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setPicker(null);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [picker]);

  const error = maps.error || vehicles.error || weather.error;
  const data: DriveData | null =
    maps.data && vehicles.data && weather.data
      ? { maps: maps.data, vehicles: vehicles.data, weather: weather.data, lines: lines.data }
      : null;

  return (
    <div className="stage relative m-3 ml-0 flex-1 overflow-hidden rounded-3xl">
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
        <Stage data={data} picker={picker} setPicker={setPicker} />
      )}
    </div>
  );
};

function routeStops(data: DriveData, choice: ReturnType<typeof useDuty>['choice']): StopRow[] {
  const line = !choice.free ? data.lines?.find((l) => l.name === choice.line) : undefined;
  const tour = line?.tours.find((tr) => tr.number === choice.tour) ?? line?.tours[0];
  const trip = tour?.trips[choice.trip === '' ? 0 : Number(choice.trip)] ?? tour?.trips[0];
  if (trip) {
    return trip.stops.map((s) => ({
      name: s.name,
      time: hhmm(s.dep >= 0 ? s.dep : s.arr),
    }));
  }
  return [];
}

function Stage({
  data,
  picker,
  setPicker,
}: {
  data: DriveData;
  picker: Picker | null;
  setPicker: (p: Picker | null) => void;
}) {
  const { choice, update, server } = useDuty();
  const bus = data.vehicles.find((v) => v.file === choice.bus);
  const map = data.maps.find((m) => m.file === choice.map);
  const line = choice.free ? undefined : data.lines?.find((l) => l.name === choice.line);
  const tour = line?.tours.find((tr) => tr.number === choice.tour);
  const paints = bus?.paints ?? [];
  const paintIndex = Math.max(0, paints.indexOf(choice.paint));
  const stops = routeStops(data, choice);

  const cyclePaint = (delta: number) =>
    paints.length &&
    update({ paint: paints[(paintIndex + delta + paints.length) % paints.length] });

  const duty = !line
    ? !choice.free && !data.lines
      ? t('drive.route.readingTimetable')
      : t('drive.summary.freeDrive')
    : tour
      ? t('drive.summary.lineTour', { line: lineLabel(line.name), tour: tour.number })
      : t('drive.summary.lineOnly', { line: lineLabel(line.name) });

  return (
    <>
      {map && <MapBackdrop mapFile={map.file} />}

      <div className="absolute inset-0 grid grid-cols-[40%_60%]">
        <div className="flex min-h-0 flex-col pt-48 pr-4 pb-36 pl-12">
          {stops.length > 0 ? (
            <StopList stops={stops} title={t('drive.stage.firstTrip')} />
          ) : (
            map?.description && (
              <p className="max-w-[24rem] text-[15.5px] leading-relaxed text-ink/80">
                {map.description}
              </p>
            )
          )}
        </div>
        <div className="min-h-0 pt-32 pb-28">
          {bus && <BusViewer bus={bus.file} paint={choice.paint || bus.default_paint} />}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPicker('route')}
        className="group absolute top-10 left-12 max-w-[50%] text-left"
      >
        <span className="eyebrow">{t('drive.stage.route')}</span>
        <span className="mt-1 flex items-center gap-2 font-display text-[2.6rem] leading-tight font-bold tracking-tight text-heading">
          <span className="truncate">{map?.friendly ?? '–'}</span>
          <Icon name="expand_more" size={28} style={{ opacity: 0.5 }} />
        </span>
        <span className="mt-1 block text-[17px] text-muted group-hover:text-ink">
          {duty}
          {tour && ` · ${hhmm(tour.first)} – ${hhmm(tour.last)}`}
        </span>
      </button>

      <div className="absolute top-10 right-12 w-[40%] text-right">
        <button
          type="button"
          onClick={() => setPicker('bus')}
          className="group block w-full text-right"
        >
          <span className="eyebrow block">{t('drive.stage.bus')}</span>
          <span className="mt-1 flex min-w-0 items-center justify-end gap-2 font-display text-[1.9rem] leading-tight font-bold tracking-tight text-heading">
            <span className="min-w-0 truncate">{bus?.name ?? t('drive.summary.noBus')}</span>
            <Icon name="expand_more" size={24} style={{ opacity: 0.5 }} />
          </span>
        </button>
        <div className="mt-1 flex items-center justify-end gap-1 text-muted">
          {paints.length > 1 && (
            <button
              type="button"
              className="theme-toggle size-8"
              aria-label={t('drive.bus.prevLivery')}
              onClick={() => cyclePaint(-1)}
            >
              <Icon name="chevron_left" size={20} />
            </button>
          )}
          <span className="truncate">{choice.paint || bus?.default_paint}</span>
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

      {!picker && <Dock data={data} onPick={setPicker} duty={duty} />}

      {picker && (
        <div
          className={`absolute inset-y-3 z-10 flex w-[min(46rem,54%)] flex-col rounded-2xl border border-line bg-page/95 shadow-2xl backdrop-blur-xl ${
            picker === 'bus' ? 'left-3' : 'right-3'
          }`}
          role="dialog"
          aria-label={t(`drive.pickers.${picker}`)}
        >
          <div className="flex shrink-0 items-center justify-between px-8 pt-7 pb-4">
            <h2 className="section-title text-[1.5rem]">{t(`drive.pickers.${picker}`)}</h2>
            <button
              type="button"
              className="btn gap-1.5 px-4 py-1.5"
              onClick={() => setPicker(null)}
            >
              <Icon name="check" size={18} />
              {t('drive.pickers.done')}
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-2 pb-8">
            {picker === 'bus' ? (
              <BusStep data={data} />
            ) : picker === 'route' ? (
              <RouteStep data={data} />
            ) : (
              <TimeStep data={data} />
            )}
          </div>
        </div>
      )}

      {server && !picker && (
        <div className="absolute top-36 right-12 flex items-center gap-2 rounded-full bg-page/70 px-4 py-1.5 text-[14.5px] backdrop-blur">
          <Icon name="dns" size={16} style={{ color: 'var(--accent)' }} />
          {t('drive.stage.onServer', { server: server.name })}
        </div>
      )}
    </>
  );
}

function Dock({
  data,
  onPick,
  duty,
}: {
  data: DriveData;
  onPick: (p: Picker) => void;
  duty: string;
}) {
  const { choice, server, setServer } = useDuty();
  const { instances, refreshInstances } = useEngine();
  const { go } = useNav();
  const toast = useToast();
  const config = useCommand('config');
  const situations = useCommand('situations', choice.map && !server ? { map: choice.map } : null);
  const [armed, setArmed] = useState(false);
  const [starting, setStarting] = useState(false);
  const disarm = useRef<ReturnType<typeof setTimeout>>(undefined);
  const bus = data.vehicles.find((v) => v.name === choice.bus);
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

  const chips: [Picker, string, string][] = [
    ['route', t('drive.summary.duty'), duty],
    [
      'time',
      t('drive.summary.start'),
      server ? t('drive.summary.serverClock') : `${choice.time} · ${longDate(choice.date)}`,
    ],
    [
      'time',
      t('drive.summary.weather'),
      server ? server.weather : weatherLabel(choice, data.weather),
    ],
  ];

  return (
    <div className="absolute inset-x-8 bottom-8 flex items-end gap-4">
      <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
        {(bus?.missing_packs.length || running > 0 || server) && (
          <div className="flex flex-wrap gap-2">
            {bus && bus.missing_packs.length > 0 && (
              <span className="flex items-center gap-2 rounded-full bg-page/70 px-3.5 py-1 text-[14px] text-warn backdrop-blur">
                <Icon name="warning" size={16} />
                {t('drive.bus.partsMissingShort', { packs: bus.missing_packs.join(', ') })}
              </span>
            )}
            {running > 0 && (
              <button
                type="button"
                onClick={() => go('sessions')}
                className="flex items-center gap-2 rounded-full bg-page/70 px-3.5 py-1 text-[14px] backdrop-blur hover:text-heading"
              >
                <span className="size-2 rounded-full bg-ok" />
                {t('drive.start.running', { count: running })}
              </button>
            )}
            {server && (
              <button
                type="button"
                onClick={() => setServer(null)}
                className="flex items-center gap-2 rounded-full bg-page/70 px-3.5 py-1 text-[14px] backdrop-blur hover:text-heading"
              >
                <Icon name="logout" size={16} />
                {t('drive.summary.leave')}
              </button>
            )}
          </div>
        )}
        <div className="flex max-w-full divide-x divide-line overflow-hidden rounded-2xl border border-line bg-page/70 backdrop-blur-md">
          {chips.map(([target, label, value]) => (
            <button
              key={label}
              type="button"
              onClick={() => onPick(target)}
              className="min-w-0 px-6 py-3.5 text-left transition-colors hover:bg-line"
            >
              <span className="block text-[13px] font-semibold text-muted">{label}</span>
              <span className="block truncate font-medium text-heading">{value}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-2">
        {situations.data && situations.data.length > 0 && (
          <button
            type="button"
            className="btn-quiet justify-center gap-2 bg-page/70 backdrop-blur"
            onClick={() => launch(situations.data![0].file)}
          >
            <Icon name="history" size={18} />
            {t('drive.start.continue')}
          </button>
        )}
        <button
          type="button"
          className="btn h-[4.25rem] justify-center gap-2.5 rounded-2xl px-9 text-[19px]"
          disabled={starting}
          onClick={() => launch()}
        >
          <Icon name="play_arrow" size={26} />
          {armed
            ? t('drive.start.another')
            : duty === t('drive.summary.freeDrive')
              ? t('drive.start.drive')
              : t('drive.start.duty')}
        </button>
      </div>
    </div>
  );
}
