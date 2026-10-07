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
  const bus = data.vehicles.find((v) => v.file === choice.bus);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = data.vehicles.filter(
      (v) =>
        (!onlyFavourites || favourites.includes(v.file)) &&
        (!q ||
          [v.manufacturer, v.type_name, v.name, v.file].some((s) => s.toLowerCase().includes(q))),
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
    update({ bus: v.file, paint: v.default_paint, number: '', plate: '', hof: '' });

  return (
    <div className="space-y-10">
      {bus && <ChosenBus bus={bus} />}

      <section>
        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <h2 className="mr-auto font-sans text-[1.15rem]">{t('drive.bus.catalogue')}</h2>
          <label className="flex items-center gap-3 text-[15px] text-muted">
            {t('drive.bus.favouritesOnly')}
            <Switch checked={onlyFavourites} onChange={setOnlyFavourites} />
          </label>
        </div>
        <label className="relative mb-6 block">
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
          <div className="space-y-8">
            {groups.map(([maker, list]) => (
              <div key={maker}>
                <p className="eyebrow mb-3">
                  {maker} <span className="font-normal normal-case">· {list.length}</span>
                </p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-2.5">
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
              </div>
            ))}
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
        <span className={chosen ? 'text-accent' : 'text-muted'}>
          <Icon name="directions_bus" size={22} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-heading">{bus.type_name}</span>
          <span className="flex items-center gap-2 text-[14px] text-muted">
            {t('drive.bus.liveries', { count: bus.paints.length })}
            {mod && <Badge color="#4c8dff">{t('drive.bus.mod')}</Badge>}
            {bus.missing_packs.length > 0 && (
              <Badge color="var(--color-warn)">{t('drive.bus.missingBadge')}</Badge>
            )}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onFavourite}
        aria-pressed={favourite}
        aria-label={favourite ? t('drive.bus.unfavourite') : t('drive.bus.favourite')}
        className={`absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-md transition-colors hover:bg-line ${
          favourite ? 'text-accent' : 'text-line-strong hover:text-muted'
        }`}
      >
        <Icon name="star" size={18} />
      </button>
    </div>
  );
}

function ChosenBus({ bus }: { bus: VehicleInfo }) {
  const { choice, update } = useDuty();
  const auto = t('common.automatic');
  return (
    <section className="card p-7">
      <p className="eyebrow">{t('drive.bus.chosen')}</p>
      <h2 className="mt-1 font-sans text-[1.35rem]">{bus.name}</h2>
      {bus.description && <p className="mt-1.5 max-w-[42em] text-muted">{bus.description}</p>}

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
        <Field label={t('drive.bus.livery')}>
          <Select
            value={choice.paint || bus.default_paint}
            options={bus.paints.map((p) => [p, p] as const)}
            onChange={(paint) => update({ paint })}
          />
        </Field>
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
              ...bus.numbers.map(([n, plate]) => [n, `${n} · ${plate}`] as const),
            ]}
            onChange={(number) => update({ number })}
            disabled={bus.numbers.length === 0}
          />
        </Field>
        <Field label={t('drive.bus.plate')}>
          <input
            className="input"
            placeholder={auto}
            value={choice.plate}
            onChange={(e) => update({ plate: e.target.value })}
          />
        </Field>
      </div>
      <p className="mt-5 truncate font-mono text-[13px] text-muted select-text">{bus.file}</p>
    </section>
  );
}
