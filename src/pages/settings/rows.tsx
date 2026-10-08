import React from 'react';
import { ListGroup, ListRow } from '../../components/List';
import { Segmented, Select, Slider, Switch } from '../../components/ui';
import { useSettings } from '../../lib/settings';
import type { Settings } from '../../types/launcher';
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
  'corner',
] satisfies CustomId[]);

export const needsSettings = (control: Control) =>
  control.kind !== 'custom' || NEEDS_SETTINGS.has(control.id);

export function shown(row: Row, ctx: Ctx | null): boolean {
  if (!ctx) return !needsSettings(row.control);
  return !row.visible || row.visible(ctx);
}

const decimals = (step: number) => (String(step).split('.')[1] ?? '').length;

export const GroupList: React.FC<{ group: Group; rows?: readonly Row[]; ctx: Ctx | null }> = ({
  group,
  rows = group.rows,
  ctx,
}) => {
  const visible = rows.filter((row) => shown(row, ctx));
  if (!visible.length) return null;
  return (
    <ListGroup
      title={tr(`groups.${group.id}`)}
      hint={group.description ? tr(`groupHints.${group.id}`) : undefined}
    >
      {visible.map((row) => (
        <RowView key={row.key} row={row} ctx={ctx} />
      ))}
    </ListGroup>
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
  const value = ctx.s[row.key];
  const set = (v: Value) => {
    const patch: Settings = { [row.key]: v };
    if (row.key === 'graphics') patch.enhanced = v === 'enhanced';
    update(patch);
  };

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
