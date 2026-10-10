import React from 'react';
import { Icon } from '../../components/Icon';
import { ListRow } from '../../components/List';
import { Segmented, Select, Slider, Switch } from '../../components/ui';
import { useSettings } from '../../lib/settings';
import type { SettingKey } from '../../types/launcher';
import { CUSTOM } from './custom';
import { LAUNCHER_CUSTOM } from './launcher';
import {
  optionLabel,
  optionsOf,
  same,
  tr,
  type Control,
  type Ctx,
  type CustomId,
  type Group,
  type Option,
  type Row,
  type Value,
} from './schema';

export interface CustomProps {
  row: Row;
  ctx: Ctx | null;
}

const RENDERERS: Record<CustomId, React.FC<CustomProps>> = { ...CUSTOM, ...LAUNCHER_CUSTOM };

const NEEDS_SETTINGS: ReadonlySet<CustomId> = new Set([
  'preset',
  'wheel',
  'seat',
  'headPitch',
  'corner',
  'metarStation',
] satisfies CustomId[]);

export const needsSettings = (control: Control) =>
  control.kind !== 'custom' || NEEDS_SETTINGS.has(control.id);

export function shown(row: Row, ctx: Ctx | null): boolean {
  if (!ctx) return !needsSettings(row.control);
  return !row.visible || row.visible(ctx);
}

const decimals = (step: number) => (String(step).split('.')[1] ?? '').length;

export const visibleGroups = (groups: readonly Group[], ctx: Ctx | null) =>
  groups.filter(
    (g) => (!ctx || !g.visible || g.visible(ctx)) && g.rows.some((row) => shown(row, ctx)),
  );

export const GroupList: React.FC<{
  group: Group;
  rows?: readonly Row[];
  ctx: Ctx | null;
  onOpen?: () => void;
}> = ({ group, rows = group.rows, ctx, onOpen }) => {
  const visible = rows.filter((row) => shown(row, ctx));
  if (!visible.length) return null;
  const title = tr(`groups.${group.id}`);
  return (
    <section data-group={group.id} className="mt-14 scroll-mt-6 first:mt-0">
      <h3 className="mb-2 font-display text-[1.25rem] leading-tight font-bold tracking-tight text-heading">
        {onOpen ? (
          <button
            type="button"
            className="flex items-center gap-1 transition-colors hover:text-accent"
            onClick={onOpen}
          >
            {title}
            <Icon name="chevron_right" size={20} />
          </button>
        ) : (
          title
        )}
      </h3>
      {group.description && (
        <p className="-mt-1 mb-2 text-[14.5px] text-muted">{tr(`groupHints.${group.id}`)}</p>
      )}
      <div className="list">
        {visible.map((row) => (
          <RowView key={row.key} row={row} ctx={ctx} />
        ))}
      </div>
    </section>
  );
};

const RowView: React.FC<{ row: Row; ctx: Ctx | null }> = ({ row, ctx }) => {
  const label = tr(`rows.${row.key}`);
  const hint = row.hint ? tr(`hints.${row.key}`) : undefined;
  const c = row.control;
  if (c.kind === 'custom') {
    const Custom = RENDERERS[c.id];
    if (c.wide)
      return (
        <div className="px-5 py-4">
          <Custom row={row} ctx={ctx} />
        </div>
      );
    return (
      <ListRow label={label} hint={hint}>
        <Custom row={row} ctx={ctx} />
      </ListRow>
    );
  }
  if (!ctx) return null;
  return (
    <ListRow label={label} hint={hint}>
      <ControlView row={row} control={c} ctx={ctx} label={label} />
    </ListRow>
  );
};

function ControlView({
  row,
  control: c,
  ctx,
  label,
}: {
  row: Row;
  control: Exclude<Control, { kind: 'custom' }>;
  ctx: Ctx;
  label: string;
}) {
  const { update } = useSettings();
  const key = row.key as SettingKey;
  const value = ctx.s[key];
  const set = (v: Value) => update({ [key]: v });

  switch (c.kind) {
    case 'toggle':
      return <Switch checked={value === true} onChange={set} label={label} />;
    case 'slider':
      return (
        <div className="w-72">
          <Slider
            value={Number(value) || 0}
            min={c.min}
            max={c.max}
            step={c.step}
            format={c.format}
            label={label}
            onChange={(v) => set(c.store ? c.store(v) : Number(v.toFixed(decimals(c.step))))}
          />
        </div>
      );
    case 'select':
    case 'segmented': {
      const options: readonly Option[] = c.kind === 'select' ? optionsOf(c, ctx) : c.options;
      const current = options.find(([v]) => same(v, value));
      const labels = options.map((o) => [String(o[0]), optionLabel(o)] as const);
      const short = labels.length <= 3 && labels.every(([, l]) => l.length <= 12);
      if (short)
        return (
          <Segmented
            label={label}
            value={current ? String(current[0]) : ''}
            options={labels}
            onChange={(v) => set(options.find(([o]) => String(o) === v)![0])}
          />
        );
      const own =
        current || value === undefined || value === '' || typeof value === 'boolean'
          ? []
          : [
              [
                value,
                c.kind === 'select' && c.fallback ? c.fallback(value) : String(value),
              ] as const,
            ];
      return (
        <Select
          className="w-60"
          value={current ? current[0] : typeof value === 'boolean' ? '' : (value ?? '')}
          options={[...options.map((o) => [o[0], optionLabel(o)] as const), ...own]}
          onChange={set}
          label={label}
        />
      );
    }
  }
}
