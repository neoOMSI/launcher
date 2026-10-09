import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, EmptyState, Field, Select, Switch } from '../../components/ui';
import { t } from '../../i18n';
import { useDuty } from '../../lib/duty';
import type { VehicleInfo } from '../../types/launcher';
import type { DriveData } from './DrivePage';

const FAVOURITES = 'neoomsi.favourites';

function useFavourites() {
  const [list, setList] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVOURITES) ?? '[]');
    } catch {
      return [];
    }
  });
  const toggle = (name: string) => {
    const next = list.includes(name) ? list.filter((n) => n !== name) : [...list, name];
    setList(next);
    try {
      localStorage.setItem(FAVOURITES, JSON.stringify(next));
    } catch {}
  };
  return [list, toggle] as const;
}

const natural = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export const BusStep: React.FC<{ data: DriveData }> = ({ data }) => {
  const { choice, update } = useDuty();
  const [query, setQuery] = useState('');
  const [onlyFavourites, setOnlyFavourites] = useState(false);
  const [favourites, toggleFavourite] = useFavourites();
  const [opened, setOpened] = useState<string[]>([]);
  const bus = data.vehicles.find((v) => v.file === choice.bus);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = data.vehicles.filter(
      (v) =>
        (!onlyFavourites || favourites.includes(v.file)) &&
        (!q ||
          [v.manufacturer, v.typeName, v.name, v.file].some((s) => s.toLowerCase().includes(q))),
    );
    const byMaker = new Map<string, VehicleInfo[]>();
    for (const v of shown) {
      const maker = v.manufacturer || t('drive.bus.unknownMaker');
      byMaker.set(maker, [...(byMaker.get(maker) ?? []), v]);
    }
    return [...byMaker.entries()]
      .sort(([a], [b]) => natural.compare(a, b))
      .map(
        ([maker, list]) => [maker, list.sort((a, b) => natural.compare(a.name, b.name))] as const,
      );
  }, [data.vehicles, query, onlyFavourites, favourites]);

  const pick = (v: VehicleInfo) =>
    update({ bus: v.file, paint: v.defaultPaint, number: '', plate: '', hof: '' });

  return (
    <div className="space-y-8">
      {bus && <ChosenBus bus={bus} />}

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <h3 className="mr-auto text-[16px] font-semibold text-heading">
            {t('drive.bus.catalogue')}
          </h3>
          <label className="flex items-center gap-3 text-[15px] text-muted">
            {t('drive.bus.favouritesOnly')}
            <Switch checked={onlyFavourites} onChange={setOnlyFavourites} />
          </label>
        </div>
        <label className="relative mb-3 block">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">
            <Icon name="search" size={20} />
          </span>
          <input
            type="search"
            className="input pl-11"
            placeholder={t('drive.bus.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        {groups.length === 0 ? (
          <EmptyState icon="directions_bus" title={t('drive.bus.none')} />
        ) : (
          <div className="divide-y divide-line border-y border-line">
            {groups.map(([maker, list]) => {
              const open =
                query.trim() !== '' ||
                onlyFavourites ||
                opened.includes(maker) ||
                list.some((v) => v.file === choice.bus);
              return (
                <div key={maker}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 py-2.5 text-left text-[15.5px] hover:text-heading"
                    aria-expanded={open}
                    onClick={() =>
                      setOpened((all) =>
                        all.includes(maker) ? all.filter((m) => m !== maker) : [...all, maker],
                      )
                    }
                  >
                    <span className="min-w-0 flex-1 truncate font-medium text-heading">
                      {maker}
                    </span>
                    <span className="text-muted tabular-nums">{list.length}</span>
                    <Icon name={open ? 'expand_less' : 'expand_more'} size={20} />
                  </button>
                  {open && (
                    <div className="flex flex-col gap-0.5 pb-3">
                      {list.map((v) => (
                        <BusOption
                          key={v.file}
                          bus={v}
                          chosen={v.file === choice.bus}
                          favourite={favourites.includes(v.file)}
                          onPick={() => pick(v)}
                          onFavourite={() => toggleFavourite(v.file)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

function BusOption({
  bus,
  chosen,
  favourite,
  onPick,
  onFavourite,
}: {
  bus: VehicleInfo;
  chosen: boolean;
  favourite: boolean;
  onPick: () => void;
  onFavourite: () => void;
}) {
  const mod = bus.installed;
  return (
    <div className="relative">
      <button type="button" className="option pr-12" aria-pressed={chosen} onClick={onPick}>
        <Icon name="directions_bus" size={18} />
        <span className="min-w-0 flex-1 truncate">{bus.typeName}</span>
        {mod && <Badge color="#4c8dff">{t('drive.bus.mod')}</Badge>}
        {bus.missingPacks.length > 0 && (
          <Badge color="var(--color-warn)">{t('drive.bus.missingBadge')}</Badge>
        )}
      </button>
      <button
        type="button"
        onClick={onFavourite}
        aria-pressed={favourite}
        aria-label={favourite ? t('drive.bus.unfavourite') : t('drive.bus.favourite')}
        className={`absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md transition-colors hover:bg-line ${
          favourite ? 'text-accent' : 'text-line-strong hover:text-muted'
        }`}
      >
        <Icon name="star" size={16} />
      </button>
    </div>
  );
}

function ChosenBus({ bus }: { bus: VehicleInfo }) {
  const { choice, update } = useDuty();
  const [details, setDetails] = useState(false);
  const auto = t('common.automatic');
  return (
    <section className="space-y-4">
      <Field label={t('drive.bus.livery')}>
        <Select
          value={choice.paint || bus.defaultPaint}
          options={bus.paints.map((p) => [p, p] as const)}
          onChange={(paint) => update({ paint })}
        />
      </Field>
      <button
        type="button"
        className="flex items-center gap-1.5 text-[14.5px] font-medium text-muted hover:text-ink"
        aria-expanded={details}
        onClick={() => setDetails((d) => !d)}
      >
        <Icon name={details ? 'expand_less' : 'expand_more'} size={18} />
        {t('drive.bus.details')}
      </button>
      {details && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Field label={t('drive.bus.depot')}>
            <Select
              value={choice.hof}
              options={[['', auto] as const, ...bus.hofs.map((h) => [h, h] as const)]}
              onChange={(hof) => update({ hof })}
            />
          </Field>
          <Field label={t('drive.bus.fleetNumber')}>
            <Select
              value={choice.number}
              options={[
                ['', auto] as const,
                ...bus.numbers.map(({ number: n, plate }) => [n, `${n} · ${plate}`] as const),
              ]}
              onChange={(number) => update({ number })}
              disabled={bus.numbers.length === 0}
            />
          </Field>
          <div className="col-span-2">
            <Field label={t('drive.bus.plate')}>
              <input
                className="input"
                placeholder={auto}
                value={choice.plate}
                onChange={(e) => update({ plate: e.target.value })}
              />
            </Field>
          </div>
        </div>
      )}
    </section>
  );
}
