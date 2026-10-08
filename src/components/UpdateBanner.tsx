import React, { useEffect, useState } from 'react';
import { t } from '../i18n';
import { call, useEngine } from '../lib/engine';
import { useSettings } from '../lib/settings';
import type { GameRelease } from '../types/launcher';
import { Changelog } from './Changelog';
import { Icon } from './Icon';
import { Badge } from './ui';

const DISMISSED = 'neoomsi.update.dismissed';
const RECHECK_MS = 6 * 3600 * 1000;

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED);
  } catch {
    return null;
  }
}

export const openRelease = (url: string) => {
  if (window.neoomsi) void window.neoomsi.openExternal(url);
  else window.open(url, '_blank', 'noopener');
};

export const UpdateBanner: React.FC = () => {
  const { ready } = useEngine();
  const { settings } = useSettings();
  const enabled = settings?.update_check !== false;
  const [release, setRelease] = useState<GameRelease | null>(null);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    if (!ready || !enabled) return;
    let live = true;
    const check = () =>
      call('update_check')
        .then((r) => live && setRelease(r))
        .catch(() => {});
    check();
    const timer = setInterval(check, RECHECK_MS);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [ready, enabled]);

  if (!enabled || !release || dismissed === release.version) return null;

  const dismiss = () => {
    setDismissed(release.version);
    try {
      localStorage.setItem(DISMISSED, release.version);
    } catch {}
  };

  return (
    <aside className="rise mr-3 mb-3 overflow-hidden rounded-2xl bg-raised">
      <div className="flex items-center gap-3 py-2.5 pr-2.5 pl-4">
        <span className="text-accent">
          <Icon name="new_releases" size={22} />
        </span>
        <p className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="truncate font-semibold text-heading">
            {t('update.available', { version: release.version })}
          </span>
          {release.prerelease && <Badge color="var(--color-warn)">{t('update.prerelease')}</Badge>}
        </p>
        <button
          type="button"
          className="btn-quiet h-9 gap-1.5 rounded-full px-4 text-[14.5px]"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t('update.hide') : t('update.whatsNew')}
          <Icon name={open ? 'expand_less' : 'expand_more'} size={18} />
        </button>
        <button
          type="button"
          className="btn h-9 gap-1.5 rounded-full px-4 text-[14.5px]"
          onClick={() => openRelease(release.page)}
        >
          <Icon name="download" size={18} />
          {t('update.download')}
        </button>
        <button
          type="button"
          className="theme-toggle size-9 shrink-0 rounded-full"
          title={t('update.dismiss')}
          aria-label={t('update.dismiss')}
          onClick={dismiss}
        >
          <Icon name="close" size={18} />
        </button>
      </div>
      {open && (
        <div className="max-h-72 overflow-y-auto border-t border-line px-5 py-4">
          {release.notes.trim() ? (
            <Changelog notes={release.notes} />
          ) : (
            <p className="text-[14.5px] text-muted">{t('update.noNotes')}</p>
          )}
        </div>
      )}
    </aside>
  );
};
