import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { LineBadge } from '../../components/LineBadge';
import { ListGroup, ListRow } from '../../components/List';
import { PanelScreen, SearchField } from '../../components/Screen';
import { Notice, Segmented, Select, Spinner } from '../../components/ui';
import { getLanguage, t } from '../../i18n';
import { useDuty } from '../../lib/duty';
import { call, useCommand } from '../../lib/engine';
import { duration, hhmm, lineLabel, longDate } from '../../lib/format';
import { useNav, useToast } from '../../lib/nav';
import type { LineInfo, MapInfo, TourInfo, TripInfo } from '../../types/launcher';
import { MapThumb } from '../drive/MapView';
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
  sortTours,
  stopClock,
  todayIso,
  tourBlocks,
  tourEnd,
  toursServing,
  tripSeconds,
  type Departure,
} from './timetable';

type View = 'departures' | 'tours';

const dayLabel = (iso: string, year = false) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(getLanguage() === 'de' ? 'de-DE' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(year ? { year: 'numeric' } : {}),
  });

function daysLabel(days: string) {
  const key = `timetables.days.${days}`;
  const text = t(key);
  return text === key ? days : text;
}

function useMapsWithLines(maps: MapInfo[] | undefined) {
  const [has, setHas] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!maps?.length) return;
    let live = true;
    const date = todayIso();
    Promise.all(
      maps.map((m) =>
        call('lines', { map: m.file, date })
          .then((l) => [m.file, l.lines.length > 0] as const)
          .catch(() => [m.file, true] as const),
      ),
    ).then((entries) => live && setHas(Object.fromEntries(entries)));
    return () => {
      live = false;
    };
  }, [maps]);
  return has;
}

function useDrive(map: MapInfo, date: string) {
  const { choice, update, server, setServer } = useDuty();
  const { go } = useNav();
  const toast = useToast();
  return (line: LineInfo, tour: TourInfo, trip?: TripInfo) => {
    const patch = dutyPatch(choice, { map: map.file, date, line, tour, trip });
    if (server && map.file !== choice.map) setServer(null);
    update(patch);
    const params = { line: lineLabel(line.name), tour: tour.number, time: patch.time ?? '' };
    toast(t(trip ? 'timetables.dutySetTrip' : 'timetables.dutySet', params), 'tip');
    go('drive');
  };
}

export const TimetablesPage: React.FC = () => {
  const { choice } = useDuty();
  const { go } = useNav();
  const maps = useCommand('maps');
  const has = useMapsWithLines(maps.data?.maps);
  const [map, setMap] = useState(choice.map);
  const [date, setDate] = useState(choice.date || todayIso());
  const [stop, setStop] = useState('');
  const [line, setLine] = useState('');
  const [view, setView] = useState<View>('departures');
  const dateInput = useRef<HTMLInputElement>(null);

  const usable = (maps.data?.maps ?? []).filter((m) => has[m.file] !== false);
  const current = usable.find((m) => m.file === map) ?? usable[0];
  const lines = useCommand('lines', current ? { map: current.file, date } : null);
  const all = lines.data?.lines ?? [];
  const lineFilter = all.some((l) => l.name === line) ? line : '';

  let body: React.ReactNode;
  if (maps.error) {
    body = (
      <Notice tone="caution" icon="error" title={t('timetables.loadFailed')}>
        {maps.error}
      </Notice>
    );
  } else if (!maps.data) {
    body = <Spinner label={t('timetables.reading')} />;
  } else if (!current) {
    body = (
      <ListGroup>
        <ListRow label={t('timetables.noMaps')} hint={t('timetables.noMapsHint')}>
          <button
            type="button"
            className="btn-quiet h-10 rounded-full px-5"
            onClick={() => go('mods')}
          >
            {t('nav.mods')}
          </button>
        </ListRow>
      </ListGroup>
    );
  } else {
    const head = (extra?: React.ReactNode) => (
      <header className="sticky -top-9 z-20 -mt-9 mb-3 bg-raised pt-9 pb-3">
        <div className="flex h-11 items-center justify-between gap-4">
          <h2 className="min-w-0 truncate px-1 font-display text-[1.6rem] leading-[2.4rem] font-bold tracking-tight">
            {current.friendly}
            <span className="font-normal text-muted"> · {dayLabel(date)}</span>
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            {extra}
            <Segmented
              label={t('timetables.view')}
              value={view}
              options={[
                ['departures', t('timetables.departures')],
                ['tours', t('timetables.tours')],
              ]}
              onChange={setView}
            />
          </div>
        </div>
      </header>
    );
    body =
      lines.data && all.length > 0 ? (
        view === 'departures' ? (
          <Board head={head} map={current} date={date} lines={all} line={lineFilter} stop={stop} />
        ) : (
          <Tours head={head} map={current} date={date} lines={all} line={lineFilter} stop={stop} />
        )
      ) : (
        <>
          {head()}
          {lines.error ? (
            <Notice tone="caution" icon="error" title={t('timetables.timetableFailed')}>
              {lines.error}
            </Notice>
          ) : !lines.data ? (
            <Spinner label={t('timetables.readingTimetable')} />
          ) : (
            <ListGroup>
              <ListRow label={t('timetables.noTimetable')} hint={t('timetables.noTimetableHint')} />
            </ListGroup>
          )}
        </>
      );
  }

  return (
    <PanelScreen
      panel={
        <>
          <div className="shrink-0 px-6 pt-6">
            <h2 className="section-title text-[1.6rem]">{t('nav.timetables')}</h2>
            {current && (
              <Select
                className="mt-4 rounded-full border-transparent bg-sunken"
                label={t('timetables.map')}
                value={current.file}
                options={usable.map(
                  (m) => [m.file, m.friendly, <MapThumb mapFile={m.file} />] as const,
                )}
                onChange={(file) => {
                  setMap(file);
                  setLine('');
                }}
              />
            )}
            <div className="mt-2 flex h-11 items-center gap-0.5 rounded-full bg-sunken px-1">
              <button
                type="button"
                className="theme-toggle shrink-0 rounded-full"
                title={t('timetables.prevDay')}
                aria-label={t('timetables.prevDay')}
                onClick={() => setDate(shiftDate(date, -1))}
              >
                <Icon name="chevron_left" size={20} />
              </button>
              <div className="relative min-w-0 flex-1">
                <button
                  type="button"
                  className="h-9 w-full truncate rounded-full px-2 text-ink transition-colors hover:bg-line"
                  aria-label={t('timetables.date')}
                  onClick={() => dateInput.current?.showPicker?.()}
                >
                  {dayLabel(date)}
                </button>
                <input
                  ref={dateInput}
                  type="date"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0"
                  value={date}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="theme-toggle shrink-0 rounded-full"
                title={t('timetables.today')}
                aria-label={t('timetables.today')}
                disabled={date === todayIso()}
                onClick={() => setDate(todayIso())}
              >
                <Icon name="today" size={19} />
              </button>
              <button
                type="button"
                className="theme-toggle shrink-0 rounded-full"
                title={t('timetables.nextDay')}
                aria-label={t('timetables.nextDay')}
                onClick={() => setDate(shiftDate(date, 1))}
              >
                <Icon name="chevron_right" size={20} />
              </button>
            </div>
            <SearchField
              className="mt-2 w-full bg-sunken"
              value={stop}
              onChange={setStop}
              placeholder={t('timetables.stopSearch')}
            />
          </div>
          {all.length > 0 && (
            <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 pb-5 [scrollbar-width:none]">
              <button
                type="button"
                aria-current={lineFilter === '' ? 'page' : undefined}
                className={`nav-link ${lineFilter === '' ? 'on' : ''}`}
                onClick={() => setLine('')}
              >
                <Icon name="departure_board" size={20} />
                <span className="truncate">{t('timetables.allLines')}</span>
              </button>
              {all.map((l) => {
                const on = l.name === lineFilter;
                return (
                  <button
                    key={l.name}
                    type="button"
                    aria-current={on ? 'page' : undefined}
                    className={`nav-link ${on ? 'on' : ''}`}
                    onClick={() => setLine(l.name)}
                  >
                    <LineBadge line={l.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate">{(l.termini ?? []).join(' – ')}</span>
                    {!l.userAllowed && (
                      <span className="shrink-0 text-[13px] text-muted">{t('timetables.ai')}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </>
      }
    >
      <div className="mx-auto max-w-[52rem]">{body}</div>
    </PanelScreen>
  );
};

const keyOf = (d: Pick<Departure, 'line' | 'tour' | 'trip'>) =>
  `${d.line.name}|${d.tour.number}|${d.trip.index}`;

type Head = (extra?: React.ReactNode) => React.ReactNode;

function Board({
  head,
  map,
  date,
  lines,
  line,
  stop,
}: {
  head: Head;
  map: MapInfo;
  date: string;
  lines: LineInfo[];
  line: string;
  stop: string;
}) {
  const { choice } = useDuty();
  const drive = useDrive(map, date);
  const list = useMemo(() => departures(lines, line, stop), [lines, line, stop]);
  const [open, setOpen] = useState<string | null>(null);
  const rows = useRef(new Map<string, HTMLElement>());
  const ref = parseClock(choice.time) ?? 0;
  const live = date === choice.date || date === todayIso();
  const target = live ? firstAfter(list, ref) : -1;
  const dutyTour = !choice.free && choice.map === map.file ? `${choice.line}|${choice.tour}` : null;

  const jump = (smooth: boolean) => {
    const d = list[target];
    if (d)
      rows.current
        .get(keyOf(d))
        ?.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    jump(false);
  }, [map.file, date, line, stop, list.length]);

  if (list.length === 0) {
    return (
      <>
        {head()}
        <ListGroup>
          <ListRow
            label={
              stop.trim()
                ? t('timetables.noStop', { stop: stop.trim() })
                : t('timetables.noTrips', { date: dayLabel(date) })
            }
            hint={stop.trim() ? t('timetables.noStopHint') : t('timetables.noTripsHint')}
          />
        </ListGroup>
      </>
    );
  }

  return (
    <>
      {head(
        target >= 0 && (
          <button
            type="button"
            className="btn-quiet h-10 gap-1.5 rounded-full pr-4 pl-3 text-[15px]"
            title={t('timetables.nowHint', { time: hhmm(ref) })}
            onClick={() => jump(true)}
          >
            <Icon name="schedule" size={18} />
            {t('timetables.now', { time: hhmm(ref) })}
          </button>
        ),
      )}
      {byHour(list).map(({ hour, items }) => (
        <section key={hour} className="mt-5 first:mt-0">
          <h3 className="sticky top-[3.5rem] z-10 -mx-1 bg-raised px-2 py-2 text-[14px] font-semibold text-muted tabular-nums">
            {hourLabel(hour)}
          </h3>
          <div className="list">
            {items.map((d) => {
              const key = keyOf(d);
              return (
                <DepartureRow
                  key={key}
                  ref={(el) => {
                    if (el) rows.current.set(key, el);
                    else rows.current.delete(key);
                  }}
                  departure={d}
                  stop={stop}
                  past={target >= 0 && d.time < ref}
                  duty={dutyTour === `${d.line.name}|${d.tour.number}`}
                  open={open === key}
                  onToggle={() => setOpen(open === key ? null : key)}
                  onDrive={(whole) => drive(d.line, d.tour, whole ? undefined : d.trip)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

function DepartureRow({
  ref,
  departure: d,
  stop,
  past,
  duty,
  open,
  onToggle,
  onDrive,
}: {
  ref: React.Ref<HTMLDivElement>;
  departure: Departure;
  stop: string;
  past: boolean;
  duty: boolean;
  open: boolean;
  onToggle: () => void;
  onDrive: (whole: boolean) => void;
}) {
  const drivable = d.line.userAllowed;
  const facts = [
    t('timetables.from', { stop: d.stop ?? d.trip.from }),
    t('timetables.tourN', { n: d.tour.number }),
    `${d.trip.km.toFixed(1)} km`,
    duration(tripSeconds(d.trip)),
  ].join(' · ');
  return (
    <div ref={ref} className="scroll-mt-32">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        className={`list-row min-h-16 cursor-pointer gap-5 transition-colors hover:bg-page ${open ? 'bg-page' : ''}`}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
          e.preventDefault();
          onToggle();
        }}
      >
        <span
          className={`w-16 shrink-0 font-display text-[1.25rem] font-bold tabular-nums ${past ? 'text-muted' : 'text-heading'}`}
        >
          {hhmm(d.time)}
        </span>
        <span className="flex min-w-14 shrink-0">
          <LineBadge line={d.line.name} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-heading">{d.trip.terminus}</span>
            {duty && (
              <span
                className="size-2 shrink-0 rounded-full bg-brand"
                title={t('timetables.yourDuty')}
              />
            )}
          </p>
          <p className="truncate text-[14px] text-muted">{facts}</p>
        </div>
        <span className="flex w-20 shrink-0 justify-end">
          {drivable ? (
            <button
              type="button"
              className="btn-quiet h-9 rounded-full px-4 text-[15px]"
              onClick={(e) => {
                e.stopPropagation();
                onDrive(false);
              }}
            >
              {t('timetables.drive')}
            </button>
          ) : (
            <span className="text-[14px] text-muted">{t('timetables.ai')}</span>
          )}
        </span>
        <span
          className="shrink-0 text-muted transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        >
          <Icon name="expand_more" size={20} />
        </span>
      </div>
      {open && <TripDetail departure={d} stop={stop} onDrive={onDrive} />}
    </div>
  );
}

function TripDetail({
  departure: { line, tour, trip },
  stop,
  onDrive,
}: {
  departure: Departure;
  stop: string;
  onDrive: (whole: boolean) => void;
}) {
  const last = trip.stops.length - 1;
  return (
    <div className="flex items-start gap-8 bg-page pt-1 pr-5 pb-5 pl-[6.5rem]">
      <ol className="route stops min-w-0 flex-1 [&>li]:pb-1.5">
        {trip.stops.map((s, i) => {
          const hit = matchesStop(s.name, stop);
          const end = i === 0 || i === last;
          return (
            <li key={`${s.name}-${i}`}>
              <span className="flex items-baseline gap-3 text-[15px]">
                <span
                  className={`w-12 shrink-0 tabular-nums ${end || hit ? 'text-heading' : 'text-muted'}`}
                >
                  {stopClock(s).time}
                </span>
                <span
                  className={`truncate ${hit ? 'font-medium text-accent' : end ? 'font-medium text-heading' : 'text-ink'}`}
                >
                  {s.name}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      {line.userAllowed && (
        <div className="flex shrink-0 flex-col items-stretch gap-2">
          <button
            type="button"
            className="btn h-10 justify-center rounded-full px-5"
            onClick={() => onDrive(false)}
          >
            {t('timetables.driveTrip')}
          </button>
          <button
            type="button"
            className="btn-quiet h-10 justify-center rounded-full px-5"
            onClick={() => onDrive(true)}
          >
            {t('timetables.driveTour', {
              n: tour.number,
              from: hhmm(tour.trips[0]?.departure ?? tour.first),
              to: hhmm(tourEnd(tour)),
            })}
          </button>
        </div>
      )}
    </div>
  );
}

function Tours({
  head,
  map,
  date,
  lines,
  line,
  stop,
}: {
  head: Head;
  map: MapInfo;
  date: string;
  lines: LineInfo[];
  line: string;
  stop: string;
}) {
  const drive = useDrive(map, date);
  const range = useMemo(() => dayRange(lines), [lines]);
  const [open, setOpen] = useState<string | null>(null);
  const groups = lines
    .filter((l) => !line || l.name === line)
    .map((l) => ({ line: l, tours: toursServing(sortTours(l.tours), stop) }))
    .filter((g) => g.tours.length > 0);

  if (groups.length === 0) {
    return (
      <>
        {head()}
        <ListGroup>
          <ListRow
            label={t('timetables.noStop', { stop: stop.trim() })}
            hint={t('timetables.noStopHint')}
          />
        </ListGroup>
      </>
    );
  }

  return (
    <>
      {head()}
      {groups.map(({ line: l, tours }) => (
        <section key={l.name} className="mt-9 first:mt-0">
          <div className="mb-2.5 flex items-center gap-3 px-1">
            <LineBadge line={l.name} size="sm" />
            <h3 className="min-w-0 flex-1 truncate font-sans text-[15px] font-semibold text-muted">
              {(l.termini ?? []).join(' – ')}
            </h3>
            {!l.userAllowed && (
              <span className="text-[14px] text-muted">{t('timetables.aiOnly')}</span>
            )}
          </div>
          <div className="list">
            {tours.map((tour) => {
              const key = `${l.name}|${tour.number}`;
              return (
                <TourRow
                  key={key}
                  line={l}
                  tour={tour}
                  range={range}
                  open={open === key}
                  onToggle={() => setOpen(open === key ? null : key)}
                  onDrive={(trip) => drive(l, tour, trip)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

function TourRow({
  line,
  tour,
  range,
  open,
  onToggle,
  onDrive,
}: {
  line: LineInfo;
  tour: TourInfo;
  range: { start: number; end: number };
  open: boolean;
  onToggle: () => void;
  onDrive: (trip?: TripInfo) => void;
}) {
  const drivable = line.userAllowed;
  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        className={`list-row cursor-pointer gap-5 transition-colors hover:bg-page ${open ? 'bg-page' : ''}`}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
          e.preventDefault();
          onToggle();
        }}
      >
        <span className="w-24 shrink-0 font-medium text-heading">
          {t('timetables.tourN', { n: tour.number })}
        </span>
        <span className="w-28 shrink-0 text-ink tabular-nums">
          {hhmm(tour.trips[0]?.departure ?? tour.first)}–{hhmm(tourEnd(tour))}
        </span>
        <span className="w-36 shrink-0 text-[14.5px] text-muted">
          <span className="block truncate">
            {t('timetables.trips', { count: tour.trips.length })} · {daysLabel(tour.days)}
          </span>
          <span className="flex items-center gap-1.5 truncate">
            {tour.runs ? (
              <>
                <span className="size-1.5 shrink-0 rounded-full bg-ok" />
                {t('timetables.runs')}
              </>
            ) : tour.nextRun ? (
              t('timetables.nextRun', { date: longDate(tour.nextRun) })
            ) : (
              t('timetables.notRunning')
            )}
          </span>
        </span>
        <DayBar tour={tour} range={range} dim={!tour.runs} />
        <span className="flex w-20 shrink-0 justify-end">
          {drivable && (
            <button
              type="button"
              className="btn-quiet h-9 rounded-full px-4 text-[15px]"
              onClick={(e) => {
                e.stopPropagation();
                onDrive();
              }}
            >
              {t('timetables.drive')}
            </button>
          )}
        </span>
        <span
          className="shrink-0 text-muted transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        >
          <Icon name="expand_more" size={20} />
        </span>
      </div>
      {open && (
        <div className="bg-page pb-2">
          {tour.trips.map((trip) => {
            return (
              <div
                key={trip.index}
                className="flex h-11 items-center gap-5 border-t border-line pr-5 pl-[8.5rem] text-[15px]"
              >
                <span className="w-28 shrink-0 tabular-nums">
                  <span className="text-heading">{hhmm(trip.departure)}</span>
                  <span className="text-muted">–{hhmm(trip.arrival)}</span>
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-ink">
                    {trip.from} → {trip.terminus}
                  </span>
                </span>
                <span className="w-16 shrink-0 text-right text-muted tabular-nums">
                  {trip.km.toFixed(1)} km
                </span>
                <span className="flex w-[7.25rem] shrink-0 justify-end">
                  {drivable && (
                    <button
                      type="button"
                      className="theme-toggle size-8 rounded-full"
                      title={t('timetables.driveTrip')}
                      aria-label={t('timetables.driveTrip')}
                      onClick={() => onDrive(trip)}
                    >
                      <Icon name="play_arrow" size={20} />
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DayBar({
  tour,
  range,
  dim,
}: {
  tour: TourInfo;
  range: { start: number; end: number };
  dim: boolean;
}) {
  return (
    <span
      className={`relative h-1.5 min-w-20 flex-1 overflow-hidden rounded-full bg-line-strong ${dim ? 'opacity-50' : ''}`}
      title={`${hhmm(tour.trips[0]?.departure ?? tour.first)}–${hhmm(tourEnd(tour))}`}
    >
      {tourBlocks(tour, range).map((b, i) => (
        <span
          key={i}
          className={`absolute inset-y-0 ${dim ? 'bg-muted' : 'bg-brand'}`}
          style={{ left: `${b.left * 100}%`, width: `max(2px, ${b.width * 100}%)` }}
        />
      ))}
    </span>
  );
}
