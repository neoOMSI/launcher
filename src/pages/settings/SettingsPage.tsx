import React, { useState } from 'react';
import { Confirm } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { PanelScreen, SearchField } from '../../components/Screen';
import { EmptyState, Notice, Spinner } from '../../components/ui';
import { t } from '../../i18n';
import { useEngine } from '../../lib/engine';
import { useNav, useToast } from '../../lib/nav';
import { useSettings } from '../../lib/settings';
import { DiagnosticsTab } from './DiagnosticsTab';
import { LauncherProvider, useLauncherReset } from './launcher';
import { GroupList, needsSettings } from './rows';
import {
  DEFAULTS,
  isTab,
  resetPatch,
  search,
  TABS,
  tr,
  type Ctx,
  type Tab,
  type TabId,
} from './schema';

type Section = TabId | 'diagnostics';

export const SettingsPage: React.FC = () => (
  <LauncherProvider>
    <Settings />
  </LauncherProvider>
);

function Settings() {
  const { route, go } = useNav();
  const { settings, saving, error } = useSettings();
  const { status } = useEngine();
  const [query, setQuery] = useState('');
  const current: Section =
    route.section === 'diagnostics'
      ? 'diagnostics'
      : isTab(route.section)
        ? route.section
        : 'graphics';
  const tab = TABS.find((x) => x.id === current);

  const windows =
    !window.neoomsi ||
    window.neoomsi.platform === 'win32' ||
    Boolean(status.engineVersion?.includes('mock'));
  const ctx: Ctx | null = settings ? { s: { ...DEFAULTS, ...settings }, windows } : null;
  const searching = query.trim() !== '';

  const open = (id: Section) => {
    setQuery('');
    go('settings', id);
  };

  const sections: [Section, string][] = [
    ...TABS.map(({ id, icon }) => [id, icon] as [Section, string]),
    ['diagnostics', 'monitor_heart'],
  ];

  return (
    <PanelScreen
      panel={
        <>
          <div className="shrink-0 px-6 pt-6">
            <h2 className="section-title text-[1.6rem]">{t('nav.settings')}</h2>
            <SearchField
              className="mt-4 w-full bg-sunken"
              value={query}
              onChange={setQuery}
              placeholder={tr('search')}
            />
          </div>
          <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 [scrollbar-width:none]">
            {sections.map(([id, icon]) => {
              const on = !searching && id === current;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={on ? 'page' : undefined}
                  className={`nav-link ${on ? 'on' : ''}`}
                  onClick={() => open(id)}
                >
                  <Icon name={icon} size={20} />
                  <span className="truncate">{tr(`tabs.${id}`)}</span>
                </button>
              );
            })}
          </nav>
          {settings && (
            <div className="shrink-0 px-6 pt-2 pb-5">
              <SaveState saving={saving} failed={Boolean(error)} />
            </div>
          )}
        </>
      }
    >
      <div className="mx-auto max-w-[52rem]">
        {settings && error && (
          <Notice tone="caution" icon="error" title={tr('saveFailed')} className="mb-8">
            <p className="select-text">{error}</p>
          </Notice>
        )}
        {searching ? (
          <Results query={query} ctx={ctx} windows={windows} open={open} />
        ) : current === 'diagnostics' ? (
          <>
            <Title>{tr('tabs.diagnostics')}</Title>
            <DiagnosticsTab />
          </>
        ) : (
          tab && <TabBody tab={tab} ctx={ctx} />
        )}
      </div>
    </PanelScreen>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 px-1 font-display text-[1.6rem] leading-[2.4rem] font-bold tracking-tight">
      {children}
    </h2>
  );
}

function SaveState({ saving, failed }: { saving: boolean; failed: boolean }) {
  return (
    <span
      className={`flex items-center gap-1.5 text-[14px] ${failed && !saving ? 'text-danger' : 'text-muted'}`}
      aria-live="polite"
    >
      {saving ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-line-strong border-t-brand" />
      ) : (
        <Icon name={failed ? 'error' : 'check'} size={16} />
      )}
      {saving ? tr('saving') : failed ? tr('notSaved') : tr('savedAuto')}
    </span>
  );
}

function Missing() {
  const { error, reload } = useSettings();
  const { ready } = useEngine();
  const { go } = useNav();
  if (error)
    return (
      <Notice tone="caution" icon="error" title={tr('loadFailed')}>
        <p className="select-text">{error}</p>
        <button type="button" className="btn-quiet mt-4 gap-2" onClick={reload}>
          <Icon name="refresh" size={18} />
          {t('common.refresh')}
        </button>
      </Notice>
    );
  if (!ready)
    return (
      <Notice tone="warning" icon="warning" title={tr('offline')}>
        <p>{tr('offlineHint')}</p>
        <button
          type="button"
          className="btn-quiet mt-4 gap-2"
          onClick={() => go('settings', 'diagnostics')}
        >
          <Icon name="monitor_heart" size={18} />
          {tr('tabs.diagnostics')}
        </button>
      </Notice>
    );
  return <Spinner label={tr('loading')} />;
}

function TabBody({ tab, ctx }: { tab: Tab; ctx: Ctx | null }) {
  const [confirm, setConfirm] = useState(false);
  const { update } = useSettings();
  const resetLauncher = useLauncherReset();
  const toast = useToast();
  const tabName = tr(`tabs.${tab.id}`);
  const offline = !ctx && tab.groups.every((g) => g.rows.every((r) => needsSettings(r.control)));

  const reset = () => {
    setConfirm(false);
    if (ctx) update(resetPatch(tab));
    if (tab.id === 'launcher') resetLauncher();
    toast(tr('reset.done', { tab: tabName }), 'tip');
  };

  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <Title>{tabName}</Title>
        {tab.resettable && !offline && (
          <button
            type="button"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] text-muted transition-colors hover:bg-sunken hover:text-ink"
            onClick={() => setConfirm(true)}
          >
            <Icon name="restart_alt" size={18} />
            {tr('reset.short')}
          </button>
        )}
      </div>
      {!ctx && (
        <div className={offline ? '' : 'mb-10'}>
          <Missing />
        </div>
      )}
      {!offline && (
        <div>
          {tab.groups
            .filter((g) => !ctx || !g.visible || g.visible(ctx))
            .map((group) => (
              <GroupList key={group.id} group={group} ctx={ctx} />
            ))}
        </div>
      )}
      {confirm && (
        <Confirm
          title={tr('reset.title', { tab: tabName })}
          action={tr('reset.confirm')}
          onConfirm={reset}
          onCancel={() => setConfirm(false)}
        >
          {tr(tab.id === 'interface' ? 'reset.textInterface' : 'reset.text')}
        </Confirm>
      )}
    </>
  );
}

function Results({
  query,
  ctx,
  windows,
  open,
}: {
  query: string;
  ctx: Ctx | null;
  windows: boolean;
  open: (id: TabId) => void;
}) {
  const matches = search(query, ctx ?? { s: DEFAULTS, windows }).filter(
    ({ groups }) => ctx || groups.some((g) => g.rows.some((r) => !needsSettings(r.control))),
  );
  if (!matches.length)
    return (
      <EmptyState icon="search" title={tr('noResults', { query: query.trim() })}>
        {tr('noResultsHint')}
      </EmptyState>
    );
  return (
    <>
      {matches.map(({ tab, groups }) => (
        <section key={tab.id} className="mb-12 last:mb-0">
          <button
            type="button"
            className="mb-5 flex items-center gap-2 px-1 font-display text-[1.4rem] font-bold tracking-tight text-heading transition-colors hover:text-accent"
            onClick={() => open(tab.id)}
          >
            {tr(`tabs.${tab.id}`)}
            <Icon name="chevron_right" size={20} />
          </button>
          {groups.map(({ group, rows }) => (
            <GroupList key={group.id} group={group} rows={rows} ctx={ctx} />
          ))}
        </section>
      ))}
    </>
  );
}
