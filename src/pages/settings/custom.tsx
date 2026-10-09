import React from 'react';
import { Icon } from '../../components/Icon';
import { Segmented } from '../../components/ui';
import { call, errorText, useCommand } from '../../lib/engine';
import { bytes } from '../../lib/format';
import { useNav, useToast } from '../../lib/nav';
import { useSettings } from '../../lib/settings';
import { PaxState } from '../../types/launcher';
import type { CustomProps } from './rows';
import { PRESET_IDS, PRESETS, presetOf, tr, type CustomId, type PresetId } from './schema';

const Preset: React.FC<CustomProps> = ({ ctx }) => {
  const { update } = useSettings();
  if (!ctx) return null;
  const current = presetOf(ctx.s);
  return (
    <div className="flex items-center gap-4">
      {current === 'custom' && (
        <span className="text-[14.5px] text-muted">{tr('presets.custom')}</span>
      )}
      <Segmented<PresetId>
        label={tr('rows.preset')}
        value={current === 'custom' ? ('' as PresetId) : current}
        options={PRESET_IDS.map((id) => [id, tr(`presets.${id}`)] as const)}
        onChange={(id) => update(PRESETS[id])}
      />
    </div>
  );
};

const GoButton: React.FC<{ icon: string; label: string; onClick: () => void }> = ({
  icon,
  label,
  onClick,
}) => (
  <button
    type="button"
    className="btn-quiet h-10 gap-2 self-start rounded-full pr-5 pl-4"
    onClick={onClick}
  >
    <Icon name={icon} size={18} />
    {label}
  </button>
);

const Keys: React.FC<CustomProps> = () => {
  const { go } = useNav();
  return (
    <GoButton icon="keyboard" label={tr('actions.changeKeys')} onClick={() => go('controls')} />
  );
};

const VrKeys: React.FC<CustomProps> = () => {
  const { go } = useNav();
  return (
    <GoButton icon="keyboard" label={tr('actions.changeVrKeys')} onClick={() => go('controls')} />
  );
};

const Wheel: React.FC<CustomProps> = () => {
  const { go } = useNav();
  const { update } = useSettings();
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <GoButton
        icon="restart_alt"
        label={tr('actions.resetWheel')}
        onClick={() =>
          update({ wheel_range: 900, wheel_lock: 0, ff_invert: false, ff_enabled: true })
        }
      />
      <GoButton
        icon="sports_esports"
        label={tr('actions.setUpWheel')}
        onClick={() => go('controls', 'controllers')}
      />
    </div>
  );
};

const PaxPackRow: React.FC<CustomProps> = () => {
  const pack = useCommand('paxPack');
  const toast = useToast();
  const get = () => call('installPaxPack').catch((err) => toast(errorText(err), 'caution'));
  const p = pack.data;
  if (!p) return null;
  if (p.state === PaxState.DOWNLOADING || p.state === PaxState.INSTALLING) {
    return (
      <span className="flex items-center gap-2.5 text-[14.5px] text-muted tabular-nums">
        <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-brand" />
        {p.state === PaxState.INSTALLING
          ? tr('paxPack.installing')
          : p.total > 0n
            ? tr('paxPack.downloading', {
                percent: Math.round((Number(p.done) / Number(p.total)) * 100),
                size: bytes(p.total),
              })
            : tr('paxPack.starting')}
      </span>
    );
  }
  if (p.state === PaxState.INSTALLED) {
    return (
      <span className="flex items-center gap-2 text-[14.5px] text-muted">
        <Icon name="check_circle" size={18} style={{ color: 'var(--color-ok)' }} />
        {tr('paxPack.installed')}
      </span>
    );
  }
  return (
    <div className="flex flex-col items-end gap-1.5">
      <GoButton
        icon="download"
        label={
          p.state === PaxState.OUTDATED
            ? tr('paxPack.update')
            : p.state === PaxState.FAILED
              ? tr('paxPack.retry')
              : tr('paxPack.download')
        }
        onClick={get}
      />
      {p.state === PaxState.FAILED && (
        <span className="max-w-[26rem] text-right text-[13.5px] text-danger">{p.message}</span>
      )}
    </div>
  );
};

const Seat: React.FC<CustomProps> = ({ ctx }) => {
  const { update } = useSettings();
  const centred = !ctx || ['seat_x', 'seat_y', 'seat_z'].every((k) => !Number(ctx.s[k]));
  return (
    <button
      type="button"
      className="btn-quiet gap-2"
      disabled={centred}
      onClick={() => update({ seat_x: 0, seat_y: 0, seat_z: 0 })}
    >
      <Icon name="restart_alt" size={18} />
      {tr('actions.resetSeat')}
    </button>
  );
};

const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;

const Corner: React.FC<CustomProps> = ({ ctx }) => {
  const { update } = useSettings();
  if (!ctx) return null;
  const current = CORNERS.find((c) => c === ctx.s.navigator_corner) ?? 'bottom-left';
  return (
    <div className="flex items-center gap-5">
      <span className="text-[15px] text-muted">{tr(`corners.${current}`)}</span>
      <div className="flex flex-col items-center">
        <div
          role="radiogroup"
          aria-label={tr('rows.navigator_corner')}
          className="grid h-[5.5rem] w-[9rem] grid-cols-2 grid-rows-2 gap-1 rounded-lg border-2 border-line-strong bg-sunken p-1.5"
        >
          {CORNERS.map((corner) => {
            const [v, h] = corner.split('-');
            const selected = corner === current;
            return (
              <button
                key={corner}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={tr(`corners.${corner}`)}
                title={tr(`corners.${corner}`)}
                onClick={() => update({ navigator_corner: corner })}
                className={`group flex rounded-[5px] p-0.5 transition-colors hover:bg-line ${
                  v === 'top' ? 'items-start' : 'items-end'
                } ${h === 'left' ? 'justify-start' : 'justify-end'}`}
              >
                <span
                  className={`h-[1.15rem] w-[1.9rem] rounded-[3px] transition-colors ${
                    selected ? 'bg-brand' : 'bg-line-strong opacity-0 group-hover:opacity-100'
                  }`}
                />
              </button>
            );
          })}
        </div>
        <span className="h-2 w-1.5 bg-line-strong" />
        <span className="h-1 w-10 rounded-full bg-line-strong" />
      </div>
    </div>
  );
};

const MetarStation: React.FC<CustomProps> = ({ ctx }) => {
  const { update } = useSettings();
  const stored = String(ctx?.s.metar_station ?? '');
  const [draft, setDraft] = React.useState(stored);
  React.useEffect(() => setDraft(stored), [stored]);
  if (!ctx) return null;
  const set = (raw: string) => {
    const icao = raw
      .replace(/[^a-z]/gi, '')
      .slice(0, 4)
      .toUpperCase();
    setDraft(icao);
    if ((icao.length === 0 || icao.length === 4) && icao !== stored)
      update({ metar_station: icao });
  };
  return (
    <input
      className="input w-32 font-mono uppercase"
      aria-label={tr('rows.metar_station')}
      placeholder={tr('opt.automatic')}
      value={draft}
      onChange={(e) => set(e.target.value)}
      onBlur={() => setDraft(stored)}
    />
  );
};

export const CUSTOM: Pick<
  Record<CustomId, React.FC<CustomProps>>,
  'preset' | 'keys' | 'vrKeys' | 'wheel' | 'seat' | 'corner' | 'paxPack' | 'metarStation'
> = {
  paxPack: PaxPackRow,
  preset: Preset,
  keys: Keys,
  vrKeys: VrKeys,
  wheel: Wheel,
  seat: Seat,
  corner: Corner,
  metarStation: MetarStation,
};
