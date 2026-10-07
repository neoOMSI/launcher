import React from 'react';
import { Icon } from '../../components/Icon';
import { EmptyState } from '../../components/ui';
import { t } from '../../i18n';
import { useCommand } from '../../lib/engine';
import { useDuty } from '../../lib/duty';
import { hhmm } from '../../lib/format';
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
      <Trips tour={tour} />
      <Ibis line={line.name} />
    </div>
  );
};

function Trips({ tour }: { tour: TourInfo }) {
  const { choice, update } = useDuty();
  const chosen = choice.trip === '' ? 0 : Number(choice.trip);
  const pick = (index: number, departure: number) =>
    update({ trip: String(index), time: hhmm(departure - 180) });
  return (
    <section>
      <h3 className="mb-3 text-[16px] font-semibold text-heading">
        {t('drive.roadbook.startTrip')}
      </h3>
      <div className="flex flex-col gap-0.5">
        {tour.trips.map((trip) => (
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
  if (!ibis.data || ibis.data.routes.length === 0) return null;
  return (
    <section className="rounded-xl border border-line p-5">
      <h3 className="flex items-center gap-2 font-sans text-[1.05rem]">
        <Icon name="keyboard" size={18} style={{ color: 'var(--accent)' }} />
        {t('drive.roadbook.ibis')}
      </h3>
      <div className="mt-4 grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-[15px]">
        <span className="text-[13.5px] font-semibold text-muted">
          {t('drive.roadbook.ibisLine')}
        </span>
        <span className="text-[13.5px] font-semibold text-muted">
          {t('drive.roadbook.ibisRoute')}
        </span>
        <span />
        {ibis.data.routes.map((r) => (
          <React.Fragment key={r.route}>
            <code className="justify-self-start">{ibis.data!.line_code}</code>
            <code className="justify-self-start">{r.code}</code>
            <span className="truncate text-muted">{r.name}</span>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
