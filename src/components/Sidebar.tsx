import React from 'react';
import { t } from '../i18n';
import { useTheme } from '../lib/theme';
import type { EngineConnectionState, EngineStatus } from '../types/scaffold';
import { Icon } from './Icon';
import wordmark from '../../assets/logos/wordmark-gradient-dark.svg';
import wordmarkLight from '../../assets/logos/wordmark-gradient-light.svg';

export type PrimaryTab = 'launch' | 'content' | 'settings' | 'diagnostics';

const PRIMARY: [PrimaryTab, string][] = [
  ['launch', 'play_arrow'],
  ['content', 'inventory_2'],
  ['settings', 'tune'],
];

const DOT: Record<EngineConnectionState, string> = {
  connected: 'bg-ok',
  starting: 'bg-warn',
  handshaking: 'bg-warn',
  disconnected: 'bg-danger',
  error: 'bg-danger',
};

interface SidebarProps {
  activeTab: PrimaryTab;
  onSelectTab: (tab: PrimaryTab) => void;
  status: EngineStatus;
  logCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, status, logCount }) => {
  const { theme, toggle } = useTheme();
  const light = theme === 'light';
  const link = (tab: PrimaryTab, extra?: string) => ({
    className: ['docs-link w-full', activeTab === tab && 'on', extra].filter(Boolean).join(' '),
    'aria-current': activeTab === tab ? ('page' as const) : undefined,
    onClick: () => onSelectTab(tab),
  });

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line px-3 pt-6 pb-3">
      <div className="mb-8 px-3">
        <img className="logo-dark h-5 w-auto" src={wordmark} alt={t('app.brandingAlt')} />
        <img className="logo-light h-5 w-auto" src={wordmarkLight} alt={t('app.brandingAlt')} />
      </div>

      <nav aria-label={t('navigation.label')} className="flex flex-1 flex-col">
        <ul className="space-y-1">
          {PRIMARY.map(([tab, icon]) => (
            <li key={tab}>
              <button type="button" {...link(tab)}>
                <span className="truncate">{t(`navigation.${tab}`)}</span>
                <Icon name={icon} size={18} />
              </button>
            </li>
          ))}
        </ul>

        <button type="button" {...link('diagnostics', 'mt-auto')}>
          <span className="truncate">{t('navigation.diagnostics')}</span>
          <span className="flex items-center gap-2">
            {logCount > 0 && (
              <span className="rounded-full bg-line px-2.5 py-0.5 text-[13.5px] leading-normal font-medium text-accent">
                {logCount}
              </span>
            )}
            <Icon name="terminal" size={18} />
          </span>
        </button>
      </nav>

      <div className="mt-3 flex items-center gap-2.5 border-t border-line pt-3 pl-3 text-[15px] text-muted">
        <span className={`size-2 shrink-0 rounded-full ${DOT[status.connectionState]}`} />
        <span className="truncate" title={status.lastError ?? status.connectionState}>
          {t(`connection.${status.connectionState}`)}
        </span>
        <button
          type="button"
          className="theme-toggle ml-auto"
          onClick={toggle}
          aria-label={light ? t('theme.toDark') : t('theme.toLight')}
        >
          <Icon name={light ? 'dark_mode' : 'light_mode'} size={20} />
        </button>
      </div>
    </aside>
  );
};
