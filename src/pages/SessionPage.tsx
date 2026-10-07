import React, { useState } from 'react';
import { Notice, PageBody, PageHeader } from '../components/PageHeader';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
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
    <>
      <PageHeader
        title={t('launch.title')}
        actions={
          <>
            {currentSession && (
              <button
                type="button"
                className="btn-quiet gap-2"
                onClick={stopSession}
                disabled={loading}
              >
                <Icon name="stop_circle" size={18} />
                {t('launch.stopButton')}
              </button>
            )}
            <button
              type="button"
              className="btn gap-2"
              onClick={startSession}
              disabled={loading || !!currentSession}
            >
              <Icon name="play_arrow" size={18} />
              {t('launch.launchButton')}
            </button>
          </>
        }
      />

      <PageBody>
        <div className="max-w-[28rem] space-y-5">
          <Field label={t('launch.mapId')}>
            <input
              className="input"
              value={mapId}
              onChange={(e) => setMapId(e.target.value)}
              disabled={loading || !!currentSession}
            />
          </Field>

          <Field label={t('launch.vehicleId')}>
            <input
              className="input"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={loading || !!currentSession}
            />
          </Field>

          {statusText && <Notice>{statusText}</Notice>}

          {currentSession && (
            <Notice tone="tip">
              <p className="callout-title">
                <Icon name="check_circle" size={18} />
                {t('launch.activeSession', { sessionId: currentSession.sessionId })}
              </p>
              <p className="text-muted">{currentSession.message}</p>
            </Notice>
          )}
        </div>
      </PageBody>
    </>
  );
};
