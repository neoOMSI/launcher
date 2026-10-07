import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { EmptyState, Field, Select, Spinner, Switch } from '../../components/ui';
import { t } from '../../i18n';
import { useDuty } from '../../lib/duty';
import { hhmm } from '../../lib/format';
import type { LineInfo, TourInfo } from '../../types/launcher';
import type { DriveData } from './DrivePage';
import { MapThumb } from './MapView';

export const RouteStep: React.FC<{ data: DriveData }> = ({ data }) => {
  const { choice, update, server } = useDuty();
  const map = data.maps.find((m) => m.file === choice.map);
  const line = data.lines?.find((l) => l.name === choice.line);

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <Field label={t('drive.route.map')}>
          {server ? (
            <p className="flex items-center gap-2 text-muted">
              <Icon name="lock" size={18} />
              {t('drive.route.mapLocked', {
                map: map?.friendly ?? choice.map,
                server: server.name,
              })}
            </p>
          ) : (
            <Select
              value={choice.map}
              options={data.maps.map(
                (m) => [m.file, m.friendly, <MapThumb mapFile={m.file} />] as const,
              )}
              onChange={(file) =>
                update({ map: file, entry: -1, line: '', tour: '', trip: '', hof: '', stop: null })
              }
            />
          )}
        </Field>
        <Field label={t('drive.route.startAt')}>
          <Select
            value={choice.stop ? `stop:${choice.stop.id}` : `entry:${choice.entry}`}
            options={[
              [
                'entry:-1',
                choice.free ? t('drive.route.autoFirst') : t('drive.route.autoNearest'),
              ] as const,
              ...(map?.entry_points ?? []).map((e) => [`entry:${e.index}`, e.name] as const),
              ...(choice.stop
                ? [
                    [
                      `stop:${choice.stop.id}`,
                      t('drive.route.stopStart', { name: choice.stop.name }),
                    ] as const,
                  ]
                : []),
            ]}
            onChange={(v) => {
              if (v.startsWith('entry:')) update({ entry: Number(v.slice(6)), stop: null });
            }}
          />
        </Field>
        <label className="flex items-center justify-between gap-6 py-1">
          <span className="text-[15.5px]">{t('drive.route.free')}</span>
          <Switch checked={choice.free} onChange={(free) => update({ free })} />
        </label>
      </section>

      {choice.free ? null : !data.lines ? (
        <Spinner label={t('drive.route.readingTimetable')} />
      ) : (
        <>
          <Lines lines={data.lines} />
          {line && <Tours line={line} />}
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
        <h3 className="text-[16px] font-semibold text-heading">{t('drive.route.line')}</h3>
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
        <div className="flex flex-col gap-0.5">
          {shown.map((l) => (
            <button
              key={l.name}
              type="button"
              className="option"
              aria-pressed={l.name === choice.line}
              onClick={() => update({ line: l.name, tour: '', trip: '' })}
            >
              <span className="option-icon max-w-32 truncate rounded bg-sunken px-2 py-0.5 text-[13.5px] font-bold">
                {l.name}
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px]">{l.termini.join(' – ')}</span>
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
      <h3 className="mb-3 text-[16px] font-semibold text-heading">{t('drive.route.tour')}</h3>
      <div className="flex flex-col gap-0.5">
        {sorted.map((tour) => {
          return (
            <button
              key={tour.number}
              type="button"
              className={`option ${tour.runs ? '' : 'opacity-55'}`}
              aria-pressed={tour.number === choice.tour}
              onClick={() => pick(tour)}
            >
              <span className="flex-1">{t('drive.route.tourN', { n: tour.number })}</span>
              <span className="text-muted tabular-nums">
                {hhmm(tour.first)} – {hhmm(tour.last)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
