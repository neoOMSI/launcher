import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { t } from '../../i18n';
import { useToast } from '../../lib/nav';
import { useSettings } from '../../lib/settings';

const DISMISSED = 'neoomsi.promo.realisticPax';

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED) === '1';
  } catch {
    return false;
  }
}

export const PassengerPromo: React.FC = () => {
  const { settings, update } = useSettings();
  const toast = useToast();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (!settings || settings.pax_models === 'realistic' || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED, '1');
    } catch {}
  };

  return (
    <aside className="rise rounded-2xl bg-page/85 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 text-accent">
        <Icon name="groups" size={22} />
        <span className="text-[12.5px] font-bold tracking-[0.08em] uppercase">
          {t('drive.promo.badge')}
        </span>
        <button
          type="button"
          className="theme-toggle -my-1 -mr-1.5 ml-auto size-8 rounded-full"
          title={t('drive.promo.dismiss')}
          onClick={dismiss}
        >
          <Icon name="close" size={18} />
        </button>
      </div>
      <h3 className="mt-1.5 font-display text-[1.15rem] leading-tight font-bold text-heading">
        {t('drive.promo.title')}
      </h3>
      <p className="mt-1 text-[14px] leading-snug text-muted">{t('drive.promo.text')}</p>
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
    </aside>
  );
};
