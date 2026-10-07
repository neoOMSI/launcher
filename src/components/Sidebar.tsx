import React from 'react';
import { t } from '../i18n';
import { useCommand, useEngine } from '../lib/engine';
import { useNav, type PageId } from '../lib/nav';
import { useTheme } from '../lib/theme';
import { contentName } from '../lib/format';
import type { EngineConnectionState } from '../types/scaffold';
import { Icon } from './Icon';
import wordmark from '../../assets/logos/wordmark-gradient-dark.svg';
import wordmarkLight from '../../assets/logos/wordmark-gradient-light.svg';

const GROUPS: [string, [PageId, string][]][] = [
  [
    'play',
    [
      ['drive', 'directions_bus'],
      ['multiplayer', 'groups'],
      ['tutorials', 'help'],
    ],
  ],
  [
    'content',
    [
      ['mods', 'extension'],
      ['timetables', 'schedule'],
    ],
  ],
];

const BOTTOM: [PageId, string][] = [
  ['settings', 'settings'],
  ['controls', 'gamepad'],
];

const DOT: Record<EngineConnectionState, string> = {
  connected: 'bg-ok',
  starting: 'bg-warn',
  handshaking: 'bg-warn',
  disconnected: 'bg-danger',
  error: 'bg-danger',
};

function NavLink({ page, icon }: { page: PageId; icon: string }) {
  const { route, go } = useNav();
  const on = route.page === page;
  return (
    <button
      type="button"
      className={on ? 'nav-link on' : 'nav-link'}
      aria-current={on ? 'page' : undefined}
      onClick={() => go(page)}
    >
      <Icon name={icon} size={20} />
      <span className="truncate">{t(`nav.${page}`)}</span>
    </button>
  );
}

function DriverCard() {
  const { route, go } = useNav();
  const config = useCommand('config');
  const name = config.data?.profile;
  const profile = useCommand('profile', name ? { name } : null);
  const on = route.page === 'profile';
  return (
    <button
      type="button"
      className={on ? 'nav-link on h-14' : 'nav-link h-14'}
      aria-current={on ? 'page' : undefined}
      aria-label={t('nav.profile')}
      onClick={() => go('profile')}
    >
      <span className="nav-avatar">{name ? name[0] : <Icon name="person" size={18} />}</span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-ink">{name || t('rail.noDriver')}</span>
        <span className="block text-[13.5px] text-muted">
          {profile.data ? t('rail.level', { level: profile.data.level }) : t('nav.profile')}
        </span>
      </span>
    </button>
  );
}

function RunningCard() {
  const { instances } = useEngine();
  const { go } = useNav();
  const running = instances.filter((i) => i.running);
  if (running.length === 0) return null;
  const latest = running[running.length - 1];
  return (
    <button
      type="button"
      onClick={() => go('sessions')}
      className="card mb-4 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-sunken"
    >
      <span className="relative flex size-2.5 shrink-0">
        <span className="absolute inset-0 animate-ping rounded-full bg-ok opacity-60" />
        <span className="relative size-2.5 rounded-full bg-ok" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[15px] font-medium text-heading">
          {t('rail.running', { count: running.length })}
        </span>
        <span className="block truncate text-[13.5px] text-muted">
          {contentName(latest.map)} · {contentName(latest.bus)}
        </span>
      </span>
      <Icon name="chevron_right" size={18} style={{ marginLeft: 'auto', opacity: 0.6 }} />
    </button>
  );
}

export const Sidebar: React.FC = () => {
  const { theme, toggle } = useTheme();
  const { status } = useEngine();
  const { go } = useNav();
  const light = theme === 'light';

  return (
    <aside className="flex w-64 shrink-0 flex-col px-5 pt-8 pb-5">
      <div className="mb-10 px-2">
        <img className="logo-dark h-5 w-auto" src={wordmark} alt={t('app.brandingAlt')} />
        <img className="logo-light h-5 w-auto" src={wordmarkLight} alt={t('app.brandingAlt')} />
      </div>

      <nav
        aria-label={t('rail.label')}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none]"
      >
        {GROUPS.map(([group, pages]) => (
          <div key={group} className="mb-7">
            <p className="mb-2 px-2 text-[13px] font-semibold text-muted">{t(`rail.${group}`)}</p>
            <ul className="space-y-1">
              {pages.map(([page, icon]) => (
                <li key={page}>
                  <NavLink page={page} icon={icon} />
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="mb-2 px-2 text-[13px] font-semibold text-muted">{t('rail.you')}</p>
          <DriverCard />
        </div>

        <ul className="mt-auto space-y-1 pt-6">
          {BOTTOM.map(([page, icon]) => (
            <li key={page}>
              <NavLink page={page} icon={icon} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4">
        <RunningCard />
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-[14.5px] text-muted transition-colors hover:bg-sunken hover:text-ink"
            title={status.lastError ?? undefined}
            onClick={() => go('settings', 'diagnostics')}
          >
            <span className={`size-2 shrink-0 rounded-full ${DOT[status.connectionState]}`} />
            <span className="truncate">{t(`connection.${status.connectionState}`)}</span>
          </button>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-label={light ? t('theme.toDark') : t('theme.toLight')}
          >
            <Icon name={light ? 'dark_mode' : 'light_mode'} size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
};
