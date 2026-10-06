import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import type { EngineStatus } from '../types/scaffold';

interface DiagnosticsPageProps {
  status: EngineStatus;
  logs: string[];
  onConnect: () => void;
  onDisconnect: () => void;
  onClearLogs: () => void;
}

export const DiagnosticsPage: React.FC<DiagnosticsPageProps> = ({
  status,
  logs,
  onConnect,
  onDisconnect,
  onClearLogs,
}) => {
  const isConnected = status.connectionState === 'connected';

  return (
    <div className="page-content">
      <PageHeader
        title={t('diagnostics.title')}
        actions={
          <div className="action-row">
            {isConnected ? (
              <button className="btn btn-secondary" onClick={onDisconnect}>
                {t('connection.disconnect')}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onConnect}>
                {status.connectionState === 'error'
                  ? t('connection.reconnect')
                  : t('connection.connect')}
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={onClearLogs}
              disabled={logs.length === 0}
            >
              {t('diagnostics.clearLogs')}
            </button>
          </div>
        }
      />

      <div className="page-body">
        <section className="inspector-section">
          <div className="inspector-table">
            <div className="inspector-row">
              <span className="inspector-label">{t('diagnostics.state')}</span>
              <span className={`inspector-value state-${status.connectionState}`}>
                {t(`connection.${status.connectionState}`) || status.connectionState}
              </span>
            </div>

            <div className="inspector-row">
              <span className="inspector-label">{t('diagnostics.pid')}</span>
              <span className="inspector-value font-mono select-text">
                {status.pid ?? t('diagnostics.none')}
              </span>
            </div>

            <div className="inspector-row">
              <span className="inspector-label">{t('diagnostics.protocolVersion')}</span>
              <span className="inspector-value font-mono select-text">
                {status.protocolVersion ?? t('diagnostics.notNegotiated')}
              </span>
            </div>

            <div className="inspector-row">
              <span className="inspector-label">{t('diagnostics.engineVersion')}</span>
              <span className="inspector-value font-mono select-text">
                {status.engineVersion ?? t('diagnostics.unknown')}
              </span>
            </div>

            <div className="inspector-row inspector-row-top">
              <span className="inspector-label">{t('diagnostics.capabilities')}</span>
              <div className="inspector-value font-mono select-text">
                {status.capabilities.length === 0 ? (
                  <span className="text-muted">{t('diagnostics.noneNegotiated')}</span>
                ) : (
                  <ul className="capabilities-mono-list">
                    {status.capabilities.map((cap) => (
                      <li key={cap}>{cap}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {status.lastError && (
            <div className="notice-bar error select-text">{status.lastError}</div>
          )}
        </section>

        <div className="separator" />

        <section className="logs-section">
          <div className="log-viewer select-text">
            {logs.length === 0 ? (
              <div className="log-empty">{t('diagnostics.noLogs')}</div>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="log-line">
                  {l}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
