import React from 'react';
import { Notice, PageBody, PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import { t } from '../i18n';
import type { EngineConnectionState, EngineStatus } from '../types/scaffold';

const STATE_COLOR: Record<EngineConnectionState, string> = {
  connected: 'text-ok',
  starting: 'text-warn',
  handshaking: 'text-warn',
  disconnected: 'text-danger',
  error: 'text-danger',
};

interface DiagnosticsPageProps {
  status: EngineStatus;
  logs: string[];
  onConnect: () => void;
  onDisconnect: () => void;
  onClearLogs: () => void;
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-[12rem_minmax(0,1fr)] gap-4 border-t border-line px-5 py-3 first:border-t-0">
    <dt className="text-muted">{label}</dt>
    <dd className="min-w-0">{children}</dd>
  </div>
);

export const DiagnosticsPage: React.FC<DiagnosticsPageProps> = ({
  status,
  logs,
  onConnect,
  onDisconnect,
  onClearLogs,
}) => {
  const isConnected = status.connectionState === 'connected';

  return (
    <>
      <PageHeader
        title={t('diagnostics.title')}
        actions={
          isConnected ? (
            <button type="button" className="btn-quiet gap-2" onClick={onDisconnect}>
              <Icon name="stop_circle" size={18} />
              {t('connection.disconnect')}
            </button>
          ) : (
            <button type="button" className="btn gap-2" onClick={onConnect}>
              <Icon name="refresh" size={18} />
              {status.connectionState === 'error'
                ? t('connection.reconnect')
                : t('connection.connect')}
            </button>
          )
        }
      />

      <PageBody className="flex flex-col gap-6">
        <dl className="card shrink-0 text-[15.5px]">
          <Row label={t('diagnostics.state')}>
            <span className={`font-semibold ${STATE_COLOR[status.connectionState]}`}>
              {t(`connection.${status.connectionState}`)}
            </span>
          </Row>
          <Row label={t('diagnostics.pid')}>
            <span className="font-mono text-[14px] select-text">
              {status.pid ?? t('diagnostics.none')}
            </span>
          </Row>
          <Row label={t('diagnostics.protocolVersion')}>
            <span className="font-mono text-[14px] select-text">
              {status.protocolVersion ?? t('diagnostics.notNegotiated')}
            </span>
          </Row>
          <Row label={t('diagnostics.engineVersion')}>
            <span className="font-mono text-[14px] select-text">
              {status.engineVersion ?? t('diagnostics.unknown')}
            </span>
          </Row>
          <Row label={t('diagnostics.capabilities')}>
            {status.capabilities.length === 0 ? (
              <span className="text-muted">{t('diagnostics.noneNegotiated')}</span>
            ) : (
              <span className="flex flex-wrap gap-1.5">
                {status.capabilities.map((cap) => (
                  <code key={cap} className="select-text">
                    {cap}
                  </code>
                ))}
              </span>
            )}
          </Row>
        </dl>

        {status.lastError && (
          <Notice tone="caution" className="shrink-0 select-text">
            <p className="callout-title">
              <Icon name="error" size={18} />
              {t('connection.error')}
            </p>
            {status.lastError}
          </Notice>
        )}

        <div className="code min-h-40 flex-1">
          <div className="code-bar">
            <span>{t('diagnostics.log')}</span>
            <button
              type="button"
              className="code-action"
              onClick={onClearLogs}
              disabled={logs.length === 0}
            >
              {t('diagnostics.clearLogs')}
            </button>
          </div>
          <div className="code-body text-[13px]">
            {logs.length === 0 ? (
              <p className="text-muted">{t('diagnostics.noLogs')}</p>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="break-all whitespace-pre-wrap">
                  {l}
                </div>
              ))
            )}
          </div>
        </div>
      </PageBody>
    </>
  );
};
