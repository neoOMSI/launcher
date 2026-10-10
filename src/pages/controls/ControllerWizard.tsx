import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { create } from '@bufbuild/protobuf';
import { Modal } from '../../components/Dialog';
import { Switch } from '../../components/ui';
import { t } from '../../i18n';
import {
  AxisCalibrationSchema,
  AxisFunction,
  type Controller,
  type ControllerAxis,
} from '../../types/launcher';
import {
  ASSIST_STEPS,
  assistResult,
  calibrated,
  mergedCalibration,
  stepMoved,
  type Axes,
  type Found,
  type Seen,
} from './wizard';

export type WizardMode = 'assist' | 'calibrate';

const tw = (key: string, params?: Record<string, string | number>) =>
  t(`controls.controllers.wizard.${key}`, params);

function Rich({ text }: { text: string }) {
  return text.split(/\*\*(.+?)\*\*/).map((part, i) =>
    i % 2 ? (
      <strong key={i} className="font-bold text-heading">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

const pct = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(Math.round(v * 100))} %`;

function Meter({ value }: { value: number }) {
  const v = Math.max(-1, Math.min(1, value));
  return (
    <div className="relative h-1.5 flex-1 rounded-full bg-line-strong">
      <span className="absolute -inset-y-1 left-1/2 w-px bg-muted" aria-hidden="true" />
      <span
        className="absolute inset-y-0 rounded-full bg-brand"
        style={{ left: `${50 + Math.min(0, v) * 50}%`, width: `${Math.abs(v) * 50}%` }}
      />
    </div>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="mt-7 flex flex-wrap justify-end gap-2">{children}</div>;
}

const quiet = 'btn-quiet h-11 rounded-full px-5';
const primary = 'btn h-11 rounded-full px-6';

export function ControllerWizard({
  mode,
  controller: c,
  live,
  onApply,
  onClose,
}: {
  mode: WizardMode;
  controller: Controller;
  live: number[] | undefined;
  onApply: (patch: Partial<Controller>) => void;
  onClose: () => void;
}) {
  const values: Axes = c.axes.map((a, k) => (c.connected ? (live?.[k] ?? a.value) : undefined));
  const [seen, setSeen] = useState<Seen[]>(() => c.axes.map(() => ({})));

  useEffect(() => {
    setSeen((all) =>
      all.map((s, k) => {
        const v = values[k];
        if (v === undefined) return s;
        return { ...s, lo: Math.min(s.lo ?? v, v), hi: Math.max(s.hi ?? v, v) };
      }),
    );
  }, [live]);

  const shown = (a: ControllerAxis, k: number) =>
    a.function !== AxisFunction.NONE ||
    a.calibration !== undefined ||
    (seen[k].lo ?? 0) !== 0 ||
    (seen[k].hi ?? 0) !== 0;

  const body =
    mode === 'assist' ? (
      <Assist c={c} values={values} shown={shown} onApply={onApply} onClose={onClose} />
    ) : (
      <Calibrate
        c={c}
        values={values}
        seen={seen}
        setSeen={setSeen}
        shown={shown}
        onApply={onApply}
        onClose={onClose}
      />
    );

  return (
    <Modal title={tw(mode === 'assist' ? 'assist' : 'calibrate')} wide hideTitle onClose={onClose}>
      {body}
      {!c.connected && (
        <p className="mt-4 text-[15.5px] leading-relaxed text-warn">{tw('disconnected')}</p>
      )}
    </Modal>
  );
}

function Assist({
  c,
  values,
  shown,
  onApply,
  onClose,
}: {
  c: Controller;
  values: Axes;
  shown: (a: ControllerAxis, k: number) => boolean;
  onApply: (patch: Partial<Controller>) => void;
  onClose: () => void;
}) {
  const [at, setAt] = useState(0);
  const [rest, setRest] = useState<Axes>([]);
  const [held, setHeld] = useState<Axes[]>([]);
  const [error, setError] = useState<string>();
  const [found, setFound] = useState<Found[]>();
  const [invert, setInvert] = useState(c.ffInvert ?? false);

  const axesWith = (f: Found[]) =>
    c.axes.map((a, k) => ({
      ...a,
      function: f[k]?.function ?? AxisFunction.NONE,
      reversed: f[k]?.reversed ?? false,
    }));

  const finish = (f: Found[], ffInvert?: boolean) => {
    onApply(ffInvert === undefined ? { axes: axesWith(f) } : { axes: axesWith(f), ffInvert });
    onClose();
  };

  const next = (skip: boolean) => {
    setError(undefined);
    let h = held;
    if (at === 0) {
      if (values.every((v) => v === undefined)) return setError(tw('noAxes'));
      setRest(values);
    } else if (skip) {
      h = [...held, []];
    } else {
      if (!stepMoved(rest, held, values, at)) return setError(tw('notMoved'));
      h = [...held, values];
    }
    setHeld(h);
    if (at + 1 < ASSIST_STEPS.length) return setAt(at + 1);
    const result = assistResult(rest, h);
    const steering = result.some((f) => f?.function === AxisFunction.STEERING);
    if (c.ffCapable && !c.gamepad && steering) setFound(result);
    else finish(result);
  };

  if (found) {
    return (
      <>
        <h2 className="font-display text-[1.6rem] leading-snug font-normal tracking-tight text-ink">
          <Rich text={tw('feedback.text')} />
        </h2>
        <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 text-[15.5px] leading-relaxed text-ink">
          {tw('feedback.invert')}
          <Switch checked={invert} label={tw('feedback.invert')} onChange={setInvert} />
        </label>
        <Actions>
          <button type="button" className={quiet} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className={primary} onClick={() => finish(found, invert)}>
            {tw('finish')}
          </button>
        </Actions>
      </>
    );
  }

  const step = ASSIST_STEPS[at];
  const last = at + 1 === ASSIST_STEPS.length;
  return (
    <>
      <h2 className="font-display text-[1.6rem] leading-snug font-normal tracking-tight text-ink">
        <Rich text={tw(`steps.${step}`)} />
      </h2>
      <div className="mt-5 space-y-3">
        {c.axes.map(
          (a, k) =>
            shown(a, k) && (
              <div key={k} className="flex items-center gap-3 text-[14px] text-muted">
                <span className="w-24 shrink-0 truncate">{a.name}</span>
                <Meter value={values[k] ?? 0} />
              </div>
            ),
        )}
      </div>
      {error && <p className="mt-5 text-[15.5px] leading-relaxed text-warn">{error}</p>}
      <Actions>
        <button type="button" className={quiet} onClick={onClose}>
          {t('common.cancel')}
        </button>
        {at >= 2 && (
          <button type="button" className={quiet} onClick={() => next(true)}>
            {tw('skip')}
          </button>
        )}
        <button type="button" className={primary} onClick={() => next(false)}>
          {tw(last ? 'finish' : 'next')}
        </button>
      </Actions>
    </>
  );
}

function Calibrate({
  c,
  values,
  seen,
  setSeen,
  shown,
  onApply,
  onClose,
}: {
  c: Controller;
  values: Axes;
  seen: Seen[];
  setSeen: Dispatch<SetStateAction<Seen[]>>;
  shown: (a: ControllerAxis, k: number) => boolean;
  onApply: (patch: Partial<Controller>) => void;
  onClose: () => void;
}) {
  const apply = () => {
    onApply({
      axes: c.axes.map((a, k) => {
        const merged = mergedCalibration(a.calibration, seen[k]);
        return { ...a, calibration: merged && create(AxisCalibrationSchema, merged) };
      }),
    });
    onClose();
  };

  return (
    <>
      <h2 className="font-display text-[1.6rem] leading-snug font-normal tracking-tight text-ink">
        <Rich text={tw('calibrateText')} />
      </h2>
      <div className="mt-5 space-y-4">
        {c.axes.map((a, k) => {
          if (!shown(a, k)) return null;
          const s = seen[k];
          const merged = mergedCalibration(a.calibration, s);
          const cal = merged && create(AxisCalibrationSchema, merged);
          return (
            <div key={k}>
              <div className="flex items-center gap-3 text-[14px] text-muted">
                <span className="w-24 shrink-0 truncate">{a.name}</span>
                <Meter value={calibrated(cal, values[k] ?? 0)} />
                <button
                  type="button"
                  className="shrink-0 text-[14px] text-muted hover:text-ink"
                  onClick={() =>
                    setSeen((all) => all.map((x, j) => (j === k ? { cleared: true } : x)))
                  }
                >
                  {tw('clear')}
                </button>
              </div>
              <div className="mt-1 pl-[6.75rem] text-[14px] text-muted">
                {s.lo !== undefined && s.hi !== undefined && s.hi - s.lo > 0.01
                  ? tw('seen', { lo: pct(s.lo), hi: pct(s.hi) })
                  : tw('notMovedYet')}
                {s.centre !== undefined && tw('centre', { c: pct(s.centre) })}
              </div>
            </div>
          );
        })}
      </div>
      <Actions>
        <button type="button" className={quiet} onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className={quiet}
          title={tw('setCentreHint')}
          onClick={() =>
            setSeen((all) =>
              all.map((x, k) => (values[k] === undefined ? x : { ...x, centre: values[k] })),
            )
          }
        >
          {tw('setCentre')}
        </button>
        <button type="button" className={primary} onClick={apply}>
          {tw('apply')}
        </button>
      </Actions>
    </>
  );
}
