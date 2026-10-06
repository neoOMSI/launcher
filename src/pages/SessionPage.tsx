import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Field } from '../components/Field';
import { t } from '../i18n';
import type { SessionEvent } from '../types/scaffold';
import { StatusCode } from '../types/scaffold';

interface SessionPageProps {
  currentSession: SessionEvent | null;
  onSessionEvent: (evt: SessionEvent | null) => void;
}

export const SessionPage: React.FC<SessionPageProps> = ({ currentSession, onSessionEvent }) => {
  const [mapId, setMapId] = useState('berlin-spandau');
  const [vehicleId, setVehicleId] = useState('man-sd200-sd80');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const startSession = async () => {
    if (!window.neoomsi) return;
    setLoading(true);
    setStatusText(t('launch.starting'));
    try {
      const res = await window.neoomsi.startSession({
        mapId,
        vehicleId,
        profileId: 'default',
      });
      if (res.status.code === StatusCode.STATUS_OK) {
        setStatusText(t('launch.activeSession', { sessionId: res.sessionId }));
      } else {
        setStatusText(t('launch.failed', { message: res.status.message }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setStatusText(t('launch.error', { message }));
    } finally {
      setLoading(false);
    }
  };

  const stopSession = async () => {
    if (!window.neoomsi || !currentSession?.sessionId) return;
    setLoading(true);
    try {
      const res = await window.neoomsi.stopSession(currentSession.sessionId);
      if (res.code !== StatusCode.STATUS_OK) {
        throw new Error(res.message);
      }
      setStatusText(t('launch.terminated'));
      onSessionEvent(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setStatusText(t('launch.error', { message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <PageHeader
        title={t('launch.title')}
        actions={
          <div className="action-row">
            <button
              className="btn btn-primary"
              onClick={startSession}
              disabled={loading || !!currentSession}
            >
              {t('launch.launchButton')}
            </button>
            {currentSession && (
              <button className="btn btn-danger" onClick={stopSession} disabled={loading}>
                {t('launch.stopButton')}
              </button>
            )}
          </div>
        }
      />

      <div className="page-body">
        <div className="form-container">
          <Field label={t('launch.mapId')}>
            <input
              className="input-text"
              value={mapId}
              onChange={(e) => setMapId(e.target.value)}
              disabled={loading || !!currentSession}
            />
          </Field>

          <Field label={t('launch.vehicleId')}>
            <input
              className="input-text"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={loading || !!currentSession}
            />
          </Field>

          {statusText && <div className="notice-bar">{statusText}</div>}

          {currentSession && (
            <div className="active-session-banner">
              <div className="banner-title">
                {t('launch.activeSession', { sessionId: currentSession.sessionId })}
              </div>
              <div className="banner-detail">{currentSession.message}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
