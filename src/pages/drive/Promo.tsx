import React, { useState } from 'react';
import { Changelog } from '../../components/Changelog';
import { Icon } from '../../components/Icon';
import { t } from '../../i18n';
import { call, errorText, useCommand } from '../../lib/engine';
import { bytes } from '../../lib/format';
import { useToast } from '../../lib/nav';
import { useSettings } from '../../lib/settings';
import type { PaxPack } from '../../types/launcher';

const DISMISSED = 'neoomsi.promo.realisticPax';
const SEEN_RELEASE = 'neoomsi.pax.dismissedRelease';

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export type PaxNotice = 'promo' | 'missing' | 'busy' | 'update' | null;

export function paxNotice(
  realistic: boolean,
  pack: PaxPack | undefined,
  promoDismissed: boolean,
  dismissedRelease: string | null,
): PaxNotice {
  if (!realistic) return promoDismissed ? null : 'promo';
  if (!pack) return null;
  if (pack.state === 'downloading' || pack.state === 'installing') return 'busy';
  if (pack.state === 'missing' || pack.state === 'failed') return 'missing';
  if (pack.state === 'outdated' && String(pack.latest?.version ?? '') !== dismissedRelease) {
    return 'update';
  }
  return null;
}

function Card({
  badge,
  onDismiss,
  children,
}: {
  badge: string;
  onDismiss?: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside className="rise rounded-2xl bg-page/85 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 text-accent">
        <Icon name="groups" size={22} />
        <span className="text-[12.5px] font-bold tracking-[0.08em] uppercase">{badge}</span>
        {onDismiss && (
          <button
            type="button"
            className="theme-toggle -my-1 -mr-1.5 ml-auto size-8 rounded-full"
            title={t('drive.promo.dismiss')}
            onClick={onDismiss}
          >
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
      {children}
    </aside>
  );
}

const Title = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mt-1.5 font-display text-[1.15rem] leading-tight font-bold text-heading">
    {children}
  </h3>
);

const Text = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1 text-[14px] leading-snug text-muted">{children}</p>
);

export const PassengerPromo: React.FC = () => {
  const { settings, update } = useSettings();
  const realistic = settings?.pax_models === 'realistic';
  const pack = useCommand('pax_pack', realistic ? undefined : null);
  const toast = useToast();
  const [promoDismissed, setPromoDismissed] = useState(() => read(DISMISSED) === '1');
  const [dismissedRelease, setDismissedRelease] = useState(() => read(SEEN_RELEASE));
  const [changes, setChanges] = useState(false);

  if (!settings) return null;
  const p = pack.data;
  const notice = paxNotice(realistic, p, promoDismissed, dismissedRelease);
  const get = () => call('install_pax_pack').catch((err) => toast(errorText(err), 'caution'));

  if (notice === 'promo') {
    return (
      <Card
        badge={t('drive.promo.badge')}
        onDismiss={() => {
          setPromoDismissed(true);
          write(DISMISSED, '1');
        }}
      >
        <Title>{t('drive.promo.title')}</Title>
        <Text>{t('drive.promo.text')}</Text>
        <div className="mt-3.5">
          <button
            type="button"
            className="btn h-9 rounded-full px-4 text-[14.5px]"
            onClick={() => {
              update({ pax_models: 'realistic' });
              toast(t('drive.promo.enabled'), 'tip');
            }}
          >
            {t('drive.promo.enable')}
          </button>
        </div>
      </Card>
    );
  }

  if (!p) return null;

  if (notice === 'busy') {
    const share = p.total > 0 ? p.done / p.total : null;
    return (
      <Card badge={t('drive.pax.badge')}>
        <Title>{t('drive.promo.title')}</Title>
        <Text>
          {p.state === 'installing'
            ? t('drive.pax.installing')
            : share === null
              ? t('drive.pax.starting')
              : t('drive.pax.downloading', {
                  percent: Math.round(share * 100),
                  size: bytes(p.total),
                })}
        </Text>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sunken">
          <div
            className={`h-full rounded-full bg-brand transition-[width] duration-300 ${
              share === null || p.state === 'installing' ? 'w-1/3 animate-pulse' : ''
            }`}
            style={share !== null && p.state !== 'installing' ? { width: `${share * 100}%` } : {}}
          />
        </div>
      </Card>
    );
  }

  if (notice === 'missing') {
    return (
      <Card badge={t('drive.pax.badge')}>
        <Title>{t('drive.pax.missingTitle')}</Title>
        <Text>{t('drive.pax.missingText')}</Text>
        {p.state === 'failed' && (
          <p className="mt-2 text-[13.5px] leading-snug text-danger">{p.message}</p>
        )}
        <div className="mt-3.5">
          <button
            type="button"
            className="btn h-9 gap-1.5 rounded-full px-4 text-[14.5px]"
            onClick={get}
          >
            <Icon name="download" size={18} />
            {p.state === 'failed' ? t('drive.pax.retry') : t('drive.pax.download')}
          </button>
        </div>
      </Card>
    );
  }

  if (notice === 'update' && p.latest) {
    const latest = p.latest;
    return (
      <Card
        badge={t('drive.promo.badge')}
        onDismiss={() => {
          setDismissedRelease(String(latest.version));
          write(SEEN_RELEASE, String(latest.version));
        }}
      >
        <Title>{t('drive.pax.updateTitle', { version: latest.version })}</Title>
        {changes && latest.notes.trim() ? (
          <Changelog notes={latest.notes} className="mt-2 max-h-48 overflow-y-auto pr-1" />
        ) : (
          <Text>{t('drive.pax.updateText')}</Text>
        )}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn h-9 gap-1.5 rounded-full px-4 text-[14.5px]"
            onClick={get}
          >
            <Icon name="download" size={18} />
            {t('drive.pax.update')}
          </button>
          {latest.notes.trim() && (
            <button
              type="button"
              className="btn-quiet h-9 rounded-full px-4 text-[14.5px]"
              aria-expanded={changes}
              onClick={() => setChanges((v) => !v)}
            >
              {changes ? t('drive.pax.hideChanges') : t('drive.pax.whatsNew')}
            </button>
          )}
        </div>
      </Card>
    );
  }

  return null;
};
