import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { EmptyState, Field, Select, Spinner, Switch } from '../../components/ui';
import { t } from '../../i18n';
import { useCommand } from '../../lib/engine';
import { useDuty } from '../../lib/duty';
import { duration, hhmm, longDate } from '../../lib/format';
import type { LineInfo, TourInfo } from '../../types/launcher';
import type { DriveData } from './DrivePage';

export const RouteStep: React.FC<{ data: DriveData }> = ({ data }) => {
  const { choice, update, server } = useDuty();
  const map = data.maps.find((m) => m.file === choice.map);
  const line = data.lines?.find((l) => l.name === choice.line);
  const tour = line?.tours.find((tr) => tr.number === choice.tour);

  return (
    <div className="space-y-10">
      <section>
        <h3 className="eyebrow mb-3">{t('drive.route.map')}</h3>
        {server ? (
          <p className="flex items-center gap-2 text-muted">
            <Icon name="lock" size={18} />
            {t('drive.route.mapLocked', { map: map?.friendly ?? choice.map, server: server.name })}
          </p>
        ) : (
          <div className="grid gap-2.5">
            {data.maps.map((m) => (
              <button
                key={m.file}
                type="button"
                className="option items-start"
                aria-pressed={m.file === choice.map}
                onClick={() =>
                  update({ map: m.file, entry: -1, line: '', tour: '', trip: '', hof: '' })
                }
              >
                <span className={`mt-0.5 ${m.file === choice.map ? 'text-accent' : 'text-muted'}`}>
                  <Icon name="map" size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-heading">{m.friendly}</span>
                  <span className="block text-[14.5px] leading-snug text-muted">
                    {m.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <label className="flex items-center justify-between gap-8">
          <span>
            <span className="block text-heading">{t('drive.route.free')}</span>
            <span className="block text-[14.5px] text-muted">{t('drive.route.freeHint')}</span>
          </span>
          <Switch checked={choice.free} onChange={(free) => update({ free })} />
        </label>
        <Field label={t('drive.route.startAt')}>
          <Select
            value={choice.entry}
            options={[
              [
                -1,
                choice.free ? t('drive.route.autoFirst') : t('drive.route.autoNearest'),
              ] as const,
              ...(map?.entry_points ?? []).map((e) => [e.index, e.name] as const),
            ]}
            onChange={(entry) => update({ entry })}
          />
        </Field>
      </section>

      {choice.free ? null : !data.lines ? (
        <Spinner label={t('drive.route.readingTimetable')} />
      ) : (
        <>
          <Lines lines={data.lines} />
          {line && <Tours line={line} />}
          {tour && <Trips tour={tour} />}
          {line && <Ibis line={line.name} />}
        </>
      )}
    </div>
  );
};

function Lines({ lines }: { lines: LineInfo[] }) {
  const { choice, update } = useDuty();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = lines.filter(
    (l) =>
      l.user_allowed &&
      (!q ||
        l.name.toLowerCase().includes(q) ||
        l.termini.some((s) => s.toLowerCase().includes(q))),
  );
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="eyebrow">{t('drive.route.line')}</h3>
        {lines.length > 6 && (
          <input
            className="input w-48 py-1.5"
            placeholder={t('common.filter')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
      </div>
      {shown.length === 0 ? (
        <EmptyState icon="route" title={t('drive.route.noLines')} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-2.5">
          {shown.map((l) => (
            <button
              key={l.name}
              type="button"
              className="option"
              aria-pressed={l.name === choice.line}
              onClick={() => update({ line: l.name, tour: '', trip: '' })}
            >
              <span className="grid h-8 min-w-11 shrink-0 place-items-center rounded-md bg-heading px-2 font-display text-[15px] font-bold text-page">
                {l.name}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] text-heading">
                  {l.termini.join(' – ')}
                </span>
                <span className="block text-[14px] text-muted">
                  {t('drive.route.tours', { count: l.tours.length })}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function Tours({ line }: { line: LineInfo }) {
  const { choice, update } = useDuty();
  const sorted = [...line.tours].sort(
    (a, b) => Number(b.runs) - Number(a.runs) || Number(a.number) - Number(b.number),
  );
  const pick = (tour: TourInfo) => {
    const patch: Partial<typeof choice> = { tour: tour.number, trip: '' };
    if (!tour.runs && tour.next_run) patch.date = tour.next_run;
    update(patch);
  };
  return (
    <section>
      <h3 className="eyebrow mb-3">{t('drive.route.tour')}</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-2.5">
        {sorted.map((tour) => {
          const first = tour.trips[0];
          return (
            <button
              key={tour.number}
              type="button"
              className={`option block ${tour.runs ? '' : 'opacity-60'}`}
              aria-pressed={tour.number === choice.tour}
              onClick={() => pick(tour)}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-heading">
                  {t('drive.route.tourN', { n: tour.number })}
                </span>
                <span className="text-[14.5px] font-medium text-accent tabular-nums">
                  {hhmm(tour.first)} – {hhmm(tour.last)}
                </span>
              </span>
              {first && (
                <span className="mt-1 block truncate text-[14.5px] text-ink">
                  {first.from} → {first.terminus}
                </span>
              )}
              <span className="mt-0.5 block text-[14px] text-muted">
                {t('drive.route.tripsDays', { count: tour.trips.length, days: tour.days })}
                {!tour.runs &&
                  tour.next_run &&
                  ` · ${t('drive.route.runs', { date: longDate(tour.next_run) })}`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Trips({ tour }: { tour: TourInfo }) {
  const { choice, update } = useDuty();
  const chosen = choice.trip === '' ? 0 : Number(choice.trip);
  const pick = (index: number, departure: number) =>
    update({ trip: String(index), time: hhmm(departure - 180) });
  return (
    <section>
      <h3 className="eyebrow mb-1">{t('drive.route.startTrip')}</h3>
      <p className="mb-4 text-[14.5px] text-muted">{t('drive.route.startTripHint')}</p>
      <ol className="route">
        {tour.trips.map((trip) => (
          <li key={trip.index} className={trip.index < chosen ? 'opacity-45' : ''}>
            <button
              type="button"
              className="-mt-1 block w-full rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-sunken"
              onClick={() => pick(trip.index, trip.departure)}
            >
              <span className="flex items-baseline gap-3">
                <span className="font-semibold text-heading tabular-nums">
                  {hhmm(trip.departure)}
                </span>
                <span className="truncate">
                  {trip.from} → {trip.terminus}
                </span>
                {trip.index === chosen && (
                  <span className="ml-auto shrink-0 text-[13.5px] font-semibold text-accent">
                    {t('drive.route.firstTrip')}
                  </span>
                )}
              </span>
              <span className="block text-[14px] text-muted">
                {hhmm(trip.departure)}–{hhmm(trip.arrival)} ·{' '}
                {duration(trip.arrival - trip.departure)} · {trip.km.toFixed(1)} km
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Ibis({ line }: { line: string }) {
  const { choice } = useDuty();
  const ibis = useCommand('ibis', { bus: choice.bus, hof: choice.hof, line });
  if (!ibis.data || ibis.data.routes.length === 0) return null;
  return (
    <section className="rounded-xl border border-line p-5">
      <h3 className="flex items-center gap-2 font-sans text-[1.05rem]">
        <Icon name="keyboard" size={18} style={{ color: 'var(--accent)' }} />
        {t('drive.route.ibis')}
      </h3>
      <div className="mt-4 grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-[15px]">
        <span className="text-[13.5px] font-semibold text-muted">{t('drive.route.ibisLine')}</span>
        <span className="text-[13.5px] font-semibold text-muted">{t('drive.route.ibisRoute')}</span>
        <span />
        {ibis.data.routes.map((r) => (
          <React.Fragment key={r.route}>
            <code className="justify-self-start">{ibis.data!.line_code}</code>
            <code className="justify-self-start">{r.code}</code>
            <span className="truncate text-muted">{r.name}</span>
          </React.Fragment>
        ))}
      </div>
      <p className="mt-4 text-[14px] text-muted">{t('drive.route.ibisHint')}</p>
    </section>
  );
}
