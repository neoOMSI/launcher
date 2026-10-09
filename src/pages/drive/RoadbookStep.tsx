import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { SearchField } from '../../components/Screen';
import { EmptyState } from '../../components/ui';
import { t } from '../../i18n';
import { useCommand } from '../../lib/engine';
import { useDuty } from '../../lib/duty';
import { hhmm } from '../../lib/format';
import { filterBy, LONG_LIST } from '../../lib/search';
import type { TourInfo } from '../../types/launcher';
import type { DriveData } from './DrivePage';

export const RoadbookStep: React.FC<{ data: DriveData }> = ({ data }) => {
  const { choice } = useDuty();
  const line = choice.free ? undefined : data.lines?.find((l) => l.name === choice.line);
  const tour = line?.tours.find((tr) => tr.number === choice.tour);
  if (!line || !tour) {
    return (
      <EmptyState icon="receipt_long" title={t('drive.roadbook.none')}>
        {t('drive.roadbook.noneHint')}
      </EmptyState>
    );
  }
  return (
    <div className="space-y-10">
      <Trips key={`${line.name}|${tour.number}`} tour={tour} />
      <Ibis key={line.name} line={line.name} />
    </div>
  );
};

function Trips({ tour }: { tour: TourInfo }) {
  const { choice, update } = useDuty();
  const [query, setQuery] = useState('');
  const chosen = choice.trip === '' ? 0 : Number(choice.trip);
  const shown = filterBy(tour.trips, query, (trip) => [
    hhmm(trip.departure),
    trip.from,
    trip.terminus,
  ]);
  const pick = (index: number, departure: number) =>
    update({ trip: String(index), time: hhmm(departure - 180) });
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-[16px] font-semibold text-heading">{t('drive.roadbook.startTrip')}</h3>
        {tour.trips.length > LONG_LIST && (
          <SearchField
            className="h-9 w-48 text-[15px]"
            value={query}
            onChange={setQuery}
            placeholder={t('common.filter')}
          />
        )}
      </div>
      {shown.length === 0 && (
        <p className="px-3 py-2 text-[15px] text-muted">
          {t('common.noMatch', { query: query.trim() })}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {shown.map((trip) => (
          <button
            key={trip.index}
            type="button"
            className={`option ${trip.index < chosen ? 'opacity-50' : ''}`}
            aria-pressed={trip.index === chosen}
            onClick={() => pick(trip.index, trip.departure)}
          >
            <span className="w-12 shrink-0 font-medium tabular-nums">{hhmm(trip.departure)}</span>
            <span className="min-w-0 flex-1 truncate">
              {trip.from} → {trip.terminus}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Ibis({ line }: { line: string }) {
  const { choice } = useDuty();
  const ibis = useCommand('ibis', { bus: choice.bus, hof: choice.hof, line });
  const [query, setQuery] = useState('');
  if (!ibis.data || ibis.data.routes.length === 0) return null;
  const { lineCode, routes } = ibis.data;
  const shown = filterBy(routes, query, (r) => [r.code, r.name]);
  return (
    <section className="rounded-xl border border-line p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="flex items-center gap-2 font-sans text-[1.05rem]">
          <Icon name="keyboard" size={18} style={{ color: 'var(--accent)' }} />
          {t('drive.roadbook.ibis')}
        </h3>
        {routes.length > LONG_LIST && (
          <SearchField
            className="h-9 w-48 text-[15px]"
            value={query}
            onChange={setQuery}
            placeholder={t('common.filter')}
          />
        )}
      </div>
      <div className="mt-4 grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-[15px]">
        <span className="text-[13.5px] font-semibold text-muted">
          {t('drive.roadbook.ibisLine')}
        </span>
        <span className="text-[13.5px] font-semibold text-muted">
          {t('drive.roadbook.ibisRoute')}
        </span>
        <span />
        {shown.length === 0 && (
          <span className="col-span-3 text-muted">
            {t('common.noMatch', { query: query.trim() })}
          </span>
        )}
        {shown.map((r) => (
          <React.Fragment key={r.route}>
            <code className="justify-self-start">{lineCode}</code>
            <code className="justify-self-start">{r.code}</code>
            <span className="truncate text-muted">{r.name}</span>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
