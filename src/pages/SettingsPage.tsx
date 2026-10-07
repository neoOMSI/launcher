import React, { useEffect, useState } from 'react';
import { Notice, PageBody, PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
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
    <>
      <PageHeader
        title={t('settings.title')}
        actions={
          <>
            <button
              type="button"
              className="btn-quiet gap-2"
              onClick={fetchSettings}
              disabled={loading}
            >
              <Icon name="refresh" size={18} />
              {t('settings.reload')}
            </button>
            <button type="button" className="btn gap-2" onClick={saveSettings} disabled={loading}>
              <Icon name="save" size={18} />
              {t('settings.save')}
            </button>
          </>
        }
      />

      <PageBody className="flex flex-col gap-4">
        {status && <Notice tone={statusType === 'error' ? 'caution' : 'tip'}>{status}</Notice>}

        <div className="code min-h-80 flex-1">
          <div className="code-bar">
            <span>settings.json</span>
          </div>
          <textarea
            className="code-body resize-none bg-transparent outline-none"
            value={settingsJson}
            onChange={(e) => setSettingsJson(e.target.value)}
            placeholder={t('settings.placeholder')}
            spellCheck={false}
          />
        </div>
      </PageBody>
    </>
  );
};
