import React, { useState } from 'react';
import { Confirm } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { LineBadge } from '../../components/LineBadge';
import { Badge } from '../../components/ui';
import { t } from '../../i18n';
import { call, errorText, useEngine } from '../../lib/engine';
import { ago, duration, lineLabel } from '../../lib/format';
import { useToast } from '../../lib/nav';
import type { Instance } from '../../types/launcher';
import { useNames } from '../profile/names';
import { clock, exitCodeText, exitState } from './clock';
import { LogView } from './LogView';

export function duty(line: string | null | undefined, tour: string | null | undefined) {
  if (!line) return t('sessions.freeDrive');
  return tour ? t('sessions.lineTour', { line: lineLabel(line), tour }) : lineLabel(line);
}

export function Mark({ line, muted }: { line?: string | null; muted?: boolean }) {
  return (
    <span className={`shrink-0 ${muted ? 'opacity-55' : ''}`}>
      {line ? (
        <LineBadge line={line} />
      ) : (
        <span className="grid h-8 min-w-12 place-items-center text-muted">
          <Icon name="explore" size={24} />
        </span>
      )}
    </span>
  );
}

export const Game: React.FC<{ instance: Instance; now: number }> = ({ instance: i, now }) => {
  const [log, setLog] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [stopping, setStopping] = useState(false);
  const { refreshInstances } = useEngine();
  const toast = useToast();
  const names = useNames();
  const reported = i.running ? i.link?.state : undefined;
  const state = (stopping || reported === 'stopping') && i.running ? 'stopping' : exitState(i);
  const lan = i.lan_status;

  const stop = async () => {
    setConfirm(false);
    setStopping(true);
    try {
      const result = await call('stop', { pid: i.pid });
      toast(
        result.ended_by_itself ? t('sessions.stop.saved') : t('sessions.stop.forced'),
        result.ended_by_itself ? 'tip' : 'note',
      );
    } catch (err) {
      toast(errorText(err), 'caution');
    } finally {
      setStopping(false);
      refreshInstances();
    }
  };

  const status =
    state === 'running' && reported === 'starting' ? (
      <span className="text-muted">{t('sessions.state.starting')}</span>
    ) : state === 'running' && reported === 'loading' ? (
      <span className="tabular-nums">
        {t('sessions.state.loading', {
          percent: Math.round((i.link?.progress ?? 0) * 100),
        })}
      </span>
    ) : state === 'running' ? (
      <span className="inline-flex items-center gap-1.5 tabular-nums">
        <span className="size-2 rounded-full bg-ok" />
        {clock(now - i.started)}
      </span>
    ) : state === 'stopping' ? (
      <span className="text-warn">{t('sessions.state.stopping')}</span>
    ) : (
      <>
        <span className={state === 'killed' || state === 'crashed' ? 'text-danger' : ''}>
          {state === 'crashed'
            ? t('sessions.state.crashed', { code: exitCodeText(i.exit_code ?? 0) })
            : t(`sessions.state.${state}`)}
        </span>
        {' · '}
        {t('sessions.endedAgo', {
          ago: ago(i.ended ?? now),
          ran: duration((i.ended ?? now) - i.started),
        })}
      </>
    );

  const openLog = () =>
    window.neoomsi?.openPath(i.log).catch((err) => toast(errorText(err), 'caution'));

  return (
    <div>
      <div className="list-row gap-4">
        <Mark line={i.line} muted={!i.running} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2.5">
            <span className={`truncate ${i.running ? 'text-ink' : 'text-muted'}`}>
              {names.map(i.map)} · {names.bus(i.bus)}
            </span>
            {i.running && lan && (
              <Badge color="#4c8dff">
                {lan.role === 'host' ? t('sessions.lan.hosting') : t('sessions.lan.joined')}
              </Badge>
            )}
          </p>
          <p className="truncate text-[14.5px] text-muted">
            {i.profile} · {duty(i.line, i.tour)} · {status}
          </p>
          {i.running && i.last_line && (
            <p className="mt-0.5 truncate font-mono text-[13px] text-muted select-text">
              {i.last_line}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className={`theme-toggle rounded-full ${log ? 'bg-sunken text-ink' : ''}`}
            aria-label={log ? t('sessions.hideLog') : t('sessions.showLog')}
            title={log ? t('sessions.hideLog') : t('sessions.showLog')}
            aria-expanded={log}
            onClick={() => setLog((v) => !v)}
          >
            <Icon name="receipt_long" size={19} />
          </button>
          <button
            type="button"
            className="theme-toggle rounded-full"
            aria-label={t('sessions.openLog')}
            title={t('sessions.openLog')}
            onClick={openLog}
          >
            <Icon name="open_in_new" size={19} />
          </button>
          {i.running && (
            <button
              type="button"
              className="btn-quiet ml-2 h-9 rounded-full px-4 text-[14.5px] hover:text-danger"
              disabled={state === 'stopping'}
              onClick={() => setConfirm(true)}
            >
              {state === 'stopping' ? t('sessions.stop.busy') : t('sessions.stop.button')}
            </button>
          )}
        </div>
      </div>
      {log && (
        <div className="px-5 pb-5">
          <LogView instance={i} onClose={() => setLog(false)} />
        </div>
      )}
      {confirm && (
        <Confirm
          title={t('sessions.stop.title')}
          action={t('sessions.stop.confirm')}
          danger
          onConfirm={stop}
          onCancel={() => setConfirm(false)}
        >
          {t('sessions.stop.text')}
        </Confirm>
      )}
    </div>
  );
};
