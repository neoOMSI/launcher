import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { SearchField } from '../../components/Screen';
import { Notice } from '../../components/ui';
import { t } from '../../i18n';
import { useEngine } from '../../lib/engine';
import { useToast } from '../../lib/nav';
import { filterBy, LONG_LIST } from '../../lib/search';
import type { EngineConnectionState } from '../../types/scaffold';
import { tr } from './schema';

const DOT: Record<EngineConnectionState, string> = {
  connected: 'bg-ok',
  starting: 'bg-warn',
  handshaking: 'bg-warn',
  disconnected: 'bg-danger',
  error: 'bg-danger',
};

const Fact: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 border-t border-line py-3 first:border-t-0">
    <dt className="text-muted">{label}</dt>
    <dd className="min-w-0">{children}</dd>
  </div>
);

const Mono: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-mono text-[14px] text-heading select-text">{children}</span>
);

export const DiagnosticsTab: React.FC = () => {
  const { status, logs, clearLogs, connect, disconnect } = useEngine();
  const toast = useToast();
  const body = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const shown = filterBy(logs, query, (line) => [line]);
  const state = status.connectionState;
  const busy = state === 'starting' || state === 'handshaking';

  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length, query]);

  const copy = () =>
    navigator.clipboard
      .writeText(logs.join('\n'))
      .then(() => toast(tr('diagnostics.copied'), 'tip'))
      .catch(() => toast(tr('diagnostics.copyFailed'), 'caution'));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="py-1">
          <p className="flex items-center gap-2.5 font-display text-[1.3rem] font-semibold text-heading">
            <span className={`size-2.5 rounded-full ${DOT[state]}`} />
            {t(`connection.${state}`)}
          </p>
          <p className="mt-1.5 text-[14.5px] leading-snug text-muted">
            {tr(`diagnostics.state.${state}`)}
          </p>
          {state === 'connected' ? (
            <button
              type="button"
              className="btn-quiet mt-5 h-10 gap-2 rounded-full pr-5 pl-4"
              onClick={disconnect}
            >
              <Icon name="stop_circle" size={18} />
              {t('connection.disconnect')}
            </button>
          ) : (
            <button
              type="button"
              className="btn mt-5 h-10 gap-2 rounded-full pr-5 pl-4"
              disabled={busy}
              onClick={connect}
            >
              <Icon name="refresh" size={18} />
              {state === 'error' ? t('connection.reconnect') : t('connection.connect')}
            </button>
          )}
        </div>
        <dl className="flex-1 text-[15px]">
          <Fact label={tr('diagnostics.pid')}>
            <Mono>{status.pid ?? tr('diagnostics.none')}</Mono>
          </Fact>
          <Fact label={tr('diagnostics.protocol')}>
            <Mono>{status.protocolVersion ?? tr('diagnostics.notNegotiated')}</Mono>
          </Fact>
          <Fact label={tr('diagnostics.engine')}>
            <Mono>{status.engineVersion ?? tr('diagnostics.unknown')}</Mono>
          </Fact>
          <Fact label={tr('diagnostics.capabilities')}>
            {status.capabilities.length === 0 ? (
              <span className="text-muted">{tr('diagnostics.noCapabilities')}</span>
            ) : (
              <span className="flex flex-wrap gap-1.5">
                {status.capabilities.map((cap) => (
                  <code key={cap} className="select-text">
                    {cap}
                  </code>
                ))}
              </span>
            )}
          </Fact>
        </dl>
        {status.lastError && (
          <Notice tone="caution" icon="error" title={tr('diagnostics.lastError')}>
            <p className="font-mono text-[14px] break-all select-text">{status.lastError}</p>
          </Notice>
        )}
      </div>

      <div className="flex h-[30rem] min-w-0 flex-col overflow-hidden rounded-xl bg-sunken">
        <div className="flex shrink-0 items-center justify-between gap-3 py-3 pr-3 pl-5">
          <span className="font-medium text-heading">
            {tr('diagnostics.log')}
            <span className="ml-2 text-[14px] font-normal text-muted">
              {tr('diagnostics.logFile', { count: logs.length })}
            </span>
          </span>
          <span className="flex items-center gap-1">
            {logs.length > LONG_LIST && (
              <SearchField
                className="mr-1 h-8 w-48 gap-1.5 px-3 text-[14px]"
                value={query}
                onChange={setQuery}
                placeholder={t('common.filter')}
              />
            )}
            <button
              type="button"
              className="code-action"
              onClick={copy}
              disabled={logs.length === 0}
            >
              <Icon name="content_copy" size={15} />
              {tr('diagnostics.copy')}
            </button>
            <button
              type="button"
              className="code-action"
              onClick={clearLogs}
              disabled={logs.length === 0}
            >
              <Icon name="delete" size={15} />
              {tr('diagnostics.clear')}
            </button>
          </span>
        </div>
        <div
          ref={body}
          className="min-h-0 flex-1 overflow-auto border-t border-line px-5 py-4 font-mono text-[13px] leading-normal select-text"
        >
          {logs.length === 0 ? (
            <p className="text-muted">{tr('diagnostics.noLogs')}</p>
          ) : shown.length === 0 ? (
            <p className="text-muted">{t('common.noMatch', { query: query.trim() })}</p>
          ) : (
            shown.map((line, i) => (
              <div key={i} className="break-all whitespace-pre-wrap">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
