import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import { StatusCode } from '../types/scaffold';

export const SettingsPage: React.FC = () => {
  const [settingsJson, setSettingsJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'error'>('info');

  const fetchSettings = async () => {
    if (!window.neoomsi) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await window.neoomsi.getSettings();
      if (res.status.code !== StatusCode.STATUS_OK) {
        throw new Error(res.status.message);
      }
      setSettingsJson(res.settingsJson || '{}');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus(t('settings.loadFailed', { message }));
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!window.neoomsi) return;
    setLoading(true);
    setStatus(null);
    try {
      const result = await window.neoomsi.updateSettings(settingsJson);
      if (result.code !== StatusCode.STATUS_OK) {
        throw new Error(result.message);
      }
      setStatus(t('settings.saved'));
      setStatusType('info');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus(t('settings.saveFailed', { message }));
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="page-content">
      <PageHeader
        title={t('settings.title')}
        actions={
          <div className="action-row">
            <button className="btn btn-secondary" onClick={fetchSettings} disabled={loading}>
              {t('settings.reload')}
            </button>
            <button className="btn btn-primary" onClick={saveSettings} disabled={loading}>
              {t('settings.save')}
            </button>
          </div>
        }
      />

      <div className="page-body">
        {status && (
          <div className={`notice-bar ${statusType === 'error' ? 'error' : ''}`}>{status}</div>
        )}

        <div className="editor-container">
          <textarea
            className="code-editor"
            value={settingsJson}
            onChange={(e) => setSettingsJson(e.target.value)}
            placeholder={t('settings.placeholder')}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
