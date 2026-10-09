import React from 'react';
import { t } from '../i18n';
import { useCommand, useEngine } from '../lib/engine';
import { useNav, type PageId } from '../lib/nav';
import { Icon } from './Icon';

const GROUPS: [PageId, string][][] = [
  [
    ['drive', 'directions_bus'],
    ['multiplayer', 'groups'],
    ['tutorials', 'help'],
  ],
  [
    ['mods', 'extension'],
    ['timetables', 'schedule'],
    ['sessions', 'history'],
  ],
  [
    ['settings', 'settings'],
    ['controls', 'gamepad'],
  ],
];

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
          {profile.data ? t('rail.level', { level: Number(profile.data.level) }) : t('nav.profile')}
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
  return (
    <button type="button" onClick={() => go('sessions', 'running')} className="nav-link">
      <span className="mx-[5px] size-2.5 shrink-0 rounded-full bg-ok" />
      <span className="truncate text-heading">{t('rail.running', { count: running.length })}</span>
      <Icon name="chevron_right" size={18} style={{ marginLeft: 'auto', opacity: 0.6 }} />
    </button>
  );
}

export const Sidebar: React.FC = () => (
  <aside className="flex w-64 shrink-0 flex-col px-5 pt-5 pb-5">
    <nav
      aria-label={t('rail.label')}
      className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none]"
    >
      {GROUPS.map((pages, i) => (
        <ul key={i} className="mb-7 space-y-1">
          {pages.map(([page, icon]) => (
            <li key={page}>
              <NavLink page={page} icon={icon} />
            </li>
          ))}
        </ul>
      ))}

      <div className="mt-auto pt-6">
        <RunningCard />
      </div>
    </nav>

    <div className="mt-4">
      <DriverCard />
    </div>
  </aside>
);
