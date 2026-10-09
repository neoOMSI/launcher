import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Icon } from '../../components/Icon';
import { ListGroup, ListRow } from '../../components/List';
import { Notice, Select, Slider, Spinner, Switch } from '../../components/ui';
import { t, type SupportedLanguage } from '../../i18n';
import { call, errorText, useCommand } from '../../lib/engine';
import { useNav, useToast } from '../../lib/nav';
import {
  AxisFunction,
  AxisShape,
  type Controller,
  type ControllerAxis,
  type KeyBindings,
} from '../../types/launcher';
import { actionName } from './actions';
import { ControllerWizard, type WizardMode } from './ControllerWizard';
import { axisOutput, controllerChanges, curve, isBipolar } from './model';
import { calibrated } from './wizard';

const FUNCTIONS: readonly (readonly [AxisFunction, string])[] = [
  [AxisFunction.NONE, 'none'],
  [AxisFunction.STEERING, 'steering'],
  [AxisFunction.THROTTLE, 'throttle'],
  [AxisFunction.BRAKE, 'brake'],
  [AxisFunction.CLUTCH, 'clutch'],
  [AxisFunction.THROTTLE_BRAKE, 'throttle_brake'],
  [AxisFunction.LOOK_X, 'look_x'],
  [AxisFunction.LOOK_Y, 'look_y'],
];
const SHAPES: readonly (readonly [AxisShape, string])[] = [
  [AxisShape.LINEAR, 'linear'],
  [AxisShape.PROGRESSIVE, 'progressive'],
  [AxisShape.DEGRESSIVE, 'degressive'],
  [AxisShape.BI_PROGRESSIVE, 'bi-progressive'],
  [AxisShape.BI_DEGRESSIVE, 'bi-degressive'],
];

const EXTRA_ACTIONS = [
  'gear_up',
  'gear_down',
  'view_look_left',
  'view_look_right',
  'view_look_up',
  'view_look_down',
  'view_reset_direction',
  'view_interiorcam_plus',
  'view_interiorcam_minus',
  'view_toggle_viewpoint',
  'view_set_driver',
  'view_set_passenger',
  'view_set_outside',
  'sim_pause',
  'screenshot',
  'quicksave',
  'toggel_mouse_ctrl',
  'toggel_ctrler',
  ...['R', '1', '2', '3', '4', '5', '6'].map((g) => `kw_s_${g}_fest`),
];

const percent = (v: number, lang: SupportedLanguage) => {
  const n = Math.round(v * 100);
  const text = `${n < 0 ? '−' : ''}${Math.abs(n)}`;
  return lang === 'de' ? `${text} %` : `${text}%`;
};

function useLiveAxes(running: boolean) {
  const [live, setLive] = useState<Map<string, number[]>>(() => new Map());
  useEffect(() => {
    if (!running) return;
    let stopped = false;
    void (async () => {
      while (!stopped) {
        try {
          const { controllers } = await call('controllers');
          if (!stopped) {
            setLive(new Map(controllers.map((c) => [c.name, c.axes.map((a) => a.value)])));
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 100));
      }
    })();
    return () => {
      stopped = true;
    };
  }, [running]);
  return live;
}

export function useControllers() {
  const toast = useToast();
  const { data, error, loading, reload } = useCommand('controllers');
  const [stored, setStored] = useState<Controller[]>();
  const [draft, setDraft] = useState<Controller[] | null>(null);

  useEffect(() => setStored(undefined), [data]);
  const saved = stored ?? data?.controllers;
  const current = draft ?? saved;
  const changes = useMemo(
    () => (draft && saved ? controllerChanges(saved, draft) : 0),
    [draft, saved],
  );

  const save = async () => {
    if (!draft) return true;
    try {
      setStored((await call('saveControllers', { controllers: draft })).controllers);
      setDraft(null);
      reload();
      return true;
    } catch (err) {
      toast(t('controls.failed', { error: errorText(err) }), 'caution');
      return false;
    }
  };

  return {
    current,
    error,
    loading,
    reload,
    changes,
    save,
    discard: () => setDraft(null),
    update: (index: number, patch: Partial<Controller>) =>
      setDraft((d) => (d ?? saved ?? []).map((c, i) => (i === index ? { ...c, ...patch } : c))),
  };
}

export type ControllersState = ReturnType<typeof useControllers>;

function buttonActions(keys: KeyBindings | undefined, lang: SupportedLanguage) {
  const seen = new Map<string, string>();
  for (const a of [...(keys?.vehicles ?? []).map((b) => b.action), ...EXTRA_ACTIONS]) {
    if (!seen.has(a.toLowerCase())) seen.set(a.toLowerCase(), a);
  }
  return [...seen.values()]
    .map((a) => [a, actionName(a, lang)] as const)
    .sort((x, y) => x[1].localeCompare(y[1], lang));
}

export function Controllers({
  pads,
  keys,
  lang,
}: {
  pads: ControllersState;
  keys: KeyBindings | undefined;
  lang: SupportedLanguage;
}) {
  const { go } = useNav();
  const actions = useMemo(() => buttonActions(keys, lang), [keys, lang]);
  const { current } = pads;
  const live = useLiveAxes(!!current?.some((c) => c.connected && c.enabled));

  let body: ReactNode;
  if (!current) {
    body = pads.error ? (
      <Notice tone="caution" icon="error" title={t('controls.controllers.loadFailed')}>
        <p className="select-text">{pads.error}</p>
        <button
          type="button"
          className="btn-quiet mt-4 h-10 rounded-full px-5"
          onClick={pads.reload}
        >
          {t('controls.retry')}
        </button>
      </Notice>
    ) : (
      <Spinner label={t('controls.controllers.loading')} />
    );
  } else {
    const indexed = current.map((c, index) => ({ c, index }));
    const sorted = [
      ...indexed.filter(({ c }) => c.connected),
      ...indexed.filter(({ c }) => !c.connected),
    ];
    body = (
      <>
        {!indexed.some(({ c }) => c.connected) && (
          <ListGroup>
            <ListRow
              label={t('controls.controllers.noneTitle')}
              hint={t('controls.controllers.noneText')}
            />
          </ListGroup>
        )}
        {sorted.map(({ c, index }) => (
          <ControllerView
            key={`${c.name}-${index}`}
            controller={c}
            live={c.connected ? live.get(c.name) : undefined}
            lang={lang}
            actions={actions}
            onChange={(patch) => pads.update(index, patch)}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {body}
      <ListGroup title={t('controls.controllers.setUpGroup')}>
        <button type="button" className="list-row" onClick={() => go('settings', 'driving')}>
          <div className="min-w-0 flex-1">
            <div className="text-ink">{t('controls.controllers.settingsLink')}</div>
            <div className="mt-0.5 text-[14.5px] leading-snug text-muted">
              {t('controls.controllers.settingsHint')}
            </div>
          </div>
          <span className="shrink-0 text-muted">
            <Icon name="chevron_right" size={20} />
          </span>
        </button>
      </ListGroup>
    </>
  );
}

function Heading({ children, className = 'mt-10' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${className} mb-2.5 flex items-center gap-2.5 px-1 first:mt-0`}>
      {children}
    </div>
  );
}

function ControllerView({
  controller: c,
  live,
  lang,
  actions,
  onChange,
}: {
  controller: Controller;
  live: number[] | undefined;
  lang: SupportedLanguage;
  actions: (readonly [string, string])[];
  onChange: (patch: Partial<Controller>) => void;
}) {
  const setAxis = (i: number, patch: Partial<ControllerAxis>) =>
    onChange({ axes: c.axes.map((a, j) => (j === i ? { ...a, ...patch } : a)) });
  const setButton = (i: number, action: string) =>
    onChange({ buttons: c.buttons.map((b, j) => (j === i ? { ...b, action } : b)) });
  const axes = c.axes ?? [];
  const buttons = c.buttons ?? [];
  const [wizard, setWizard] = useState<WizardMode>();

  return (
    <section className="mt-12 first:mt-0">
      {wizard && (
        <ControllerWizard
          mode={wizard}
          controller={c}
          live={live}
          onApply={onChange}
          onClose={() => setWizard(undefined)}
        />
      )}
      <Heading className="">
        <span
          className={`size-2.5 shrink-0 rounded-full ${c.connected ? 'bg-ok' : 'bg-line-strong'}`}
          aria-hidden="true"
        />
        <h2 className="min-w-0 truncate font-sans text-[17px] font-semibold text-heading">
          {c.name}
        </h2>
        {!c.connected && (
          <span className="shrink-0 text-[14.5px] text-muted">
            {t('controls.controllers.disconnected')}
          </span>
        )}
      </Heading>
      <div className="list">
        <ListRow label={t('controls.controllers.use')}>
          <Switch
            checked={c.enabled}
            label={t('controls.controllers.use')}
            onChange={(enabled) => onChange({ enabled })}
          />
        </ListRow>
        {c.enabled && (
          <>
            <ListRow
              label={t('controls.controllers.deadzone')}
              hint={t('controls.controllers.deadzoneHint')}
            >
              <div className="w-60">
                <Slider
                  value={c.deadzone}
                  min={0}
                  max={0.3}
                  step={0.01}
                  label={t('controls.controllers.deadzone')}
                  format={(v) => percent(v, lang)}
                  onChange={(deadzone) => onChange({ deadzone })}
                />
              </div>
            </ListRow>
            <ListRow label={t('controls.controllers.ffb')}>
              <Switch
                checked={c.forceFeedback}
                label={t('controls.controllers.ffb')}
                onChange={(forceFeedback) => onChange({ forceFeedback })}
              />
            </ListRow>
            {c.connected && (
              <ListRow
                label={t('controls.controllers.wizard.assist')}
                hint={t('controls.controllers.wizard.assistHint')}
              >
                <button
                  type="button"
                  className="btn-quiet h-10 rounded-full px-5"
                  onClick={() => setWizard('assist')}
                >
                  {t('controls.controllers.wizard.start')}
                </button>
              </ListRow>
            )}
            {c.connected && (
              <ListRow
                label={t('controls.controllers.wizard.calibrate')}
                hint={t('controls.controllers.wizard.calibrateHint')}
              >
                <button
                  type="button"
                  className="btn-quiet h-10 rounded-full px-5"
                  onClick={() => setWizard('calibrate')}
                >
                  {t('controls.controllers.wizard.start')}
                </button>
              </ListRow>
            )}
            {axes.map((axis, i) => (
              <AxisRow
                key={i}
                axis={axis}
                raw={calibrated(axis.calibration, live?.[i] ?? axis.value)}
                deadzone={axis.calibration?.deadzone ?? c.deadzone}
                lang={lang}
                onChange={(patch) => setAxis(i, patch)}
              />
            ))}
          </>
        )}
      </div>
      {c.enabled && (
        <>
          <Heading className="mt-6">
            <h3 className="font-sans text-[15px] font-semibold text-muted">
              {t('controls.controllers.buttons')}
            </h3>
          </Heading>
          <div className="list">
            {buttons.length ? (
              buttons.map(({ action }, i) => (
                <ListRow key={i} label={t('controls.controllers.button', { n: i + 1 })}>
                  <Select
                    className="w-64"
                    label={t('controls.controllers.buttonAction', {
                      button: t('controls.controllers.button', { n: i + 1 }),
                    })}
                    value={action}
                    options={[
                      ['', t('controls.function.none')] as const,
                      ...(action && !actions.some(([a]) => a === action)
                        ? [[action, actionName(action, lang)] as const]
                        : []),
                      ...actions,
                    ]}
                    onChange={(a) => setButton(i, a)}
                  />
                </ListRow>
              ))
            ) : (
              <ListRow label={t('controls.controllers.noButtons')} />
            )}
          </div>
        </>
      )}
    </section>
  );
}

function AxisRow({
  axis,
  raw,
  deadzone,
  lang,
  onChange,
}: {
  axis: ControllerAxis;
  raw: number;
  deadzone: number;
  lang: SupportedLanguage;
  onChange: (patch: Partial<ControllerAxis>) => void;
}) {
  const used = axis.function !== AxisFunction.NONE;
  const out = axisOutput(raw, axis, deadzone);
  const bipolar = isBipolar(axis.function);
  return (
    <div className="list-row items-start">
      <div className="min-w-0 flex-1 pt-2">
        <div className={used ? 'text-ink' : 'text-muted'}>{axis.name}</div>
        <div className={`mt-2.5 flex max-w-[14rem] items-center gap-3 ${used ? '' : 'opacity-50'}`}>
          <div className="relative h-1.5 flex-1 rounded-full bg-line-strong">
            {bipolar && (
              <span className="absolute -inset-y-1 left-1/2 w-px bg-muted" aria-hidden="true" />
            )}
            <span
              className={`absolute inset-y-0 rounded-full ${used ? 'bg-brand' : 'bg-muted'}`}
              style={
                bipolar
                  ? { left: `${50 + Math.min(0, out) * 50}%`, width: `${Math.abs(out) * 50}%` }
                  : { left: 0, width: `${out * 100}%` }
              }
            />
          </div>
          <span className="w-12 shrink-0 text-right text-[14px] text-muted tabular-nums">
            {percent(out, lang)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Select
          className="w-52"
          label={t('controls.controllers.function', { axis: axis.name })}
          value={axis.function}
          options={FUNCTIONS.map(([f, key]) => [f, t(`controls.function.${key}`)] as const)}
          onChange={(f) => onChange({ function: f })}
        />
        {used && (
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2.5 text-[15px] text-muted">
              {t('controls.controllers.reversed')}
              <Switch checked={axis.reversed} onChange={(reversed) => onChange({ reversed })} />
            </label>
            <Select
              className="w-52"
              label={t('controls.controllers.curve', { axis: axis.name })}
              value={axis.shape}
              options={SHAPES.map(
                ([s, key]) =>
                  [s, t(`controls.shape.${key}`), <CurveIcon key={s} shape={s} />] as const,
              )}
              onChange={(shape) => onChange({ shape })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CurveIcon({ shape }: { shape: AxisShape }) {
  const points = Array.from({ length: 25 }, (_, i) => {
    const x = i / 24;
    return `${(2 + x * 16).toFixed(2)},${(18 - curve(shape, x) * 16).toFixed(2)}`;
  });
  return (
    <svg viewBox="0 0 20 20" className="size-5 shrink-0 text-accent" aria-hidden="true">
      <rect x="1" y="1" width="18" height="18" rx="3" fill="none" stroke="var(--line-strong)" />
      <path
        d={`M${points.join('L')}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
