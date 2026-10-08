import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import { GroupList, needsSettings, visibleGroups } from './rows';
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
  const groups = tab && !searching ? visibleGroups(tab.groups, ctx) : [];
  const outline = groups.map((g) => g.id).join('|');

  const body = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);
  const jump = useRef<string | null>(null);
  const pinned = useRef(false);
  const [active, setActive] = useState<string | null>(null);

  const open = (id: Section, group?: string) => {
    setQuery('');
    jump.current = group ?? null;
    go('settings', id);
  };

  const scrollTo = (group: string, smooth: boolean) => {
    const el = body.current?.querySelector(`[data-group="${group}"]`);
    if (!el) return;
    pinned.current = smooth;
    setActive(group);
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant', block: 'start' });
  };

  useLayoutEffect(() => {
    if (searching) return;
    if (jump.current) scrollTo(jump.current, false);
    else body.current?.scrollTo({ top: 0 });
    jump.current = null;
  }, [current, searching]);

  useEffect(() => {
    const el = body.current;
    if (!el || searching) return;
    const spy = () => {
      if (pinned.current) return;
      const anchors = [...el.querySelectorAll<HTMLElement>('[data-group]')];
      if (!anchors.length) return setActive(null);
      const line = el.getBoundingClientRect().top + el.clientHeight * 0.3;
      const end = el.scrollTop > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
      const hit = end
        ? anchors[anchors.length - 1]
        : (anchors.findLast((a) => a.getBoundingClientRect().top <= line) ?? anchors[0]);
      setActive(hit.dataset.group ?? null);
    };
    const release = () => {
      pinned.current = false;
    };
    spy();
    el.addEventListener('scroll', spy, { passive: true });
    el.addEventListener('scrollend', release);
    el.addEventListener('wheel', release, { passive: true });
    return () => {
      el.removeEventListener('scroll', spy);
      el.removeEventListener('scrollend', release);
      el.removeEventListener('wheel', release);
    };
  }, [current, searching, outline]);

  useEffect(() => {
    const list = nav.current;
    const item = list?.querySelector('.subnav-link.on');
    if (!list || !item) return;
    const a = item.getBoundingClientRect();
    const b = list.getBoundingClientRect();
    if (a.bottom > b.bottom) list.scrollTop += a.bottom - b.bottom + 12;
    else if (a.top < b.top) list.scrollTop -= b.top - a.top + 12;
  }, [active]);

  const navItem = (id: Section, icon: string) => {
    const on = !searching && id === current;
    return (
      <div key={id}>
        <button
          type="button"
          aria-current={on ? 'page' : undefined}
          className={`nav-link h-9 ${on ? 'on' : ''}`}
          onClick={() => open(id)}
        >
          <Icon name={icon} size={20} />
          <span className="truncate">{tr(`tabs.${id}`)}</span>
        </button>
        {on && groups.length > 1 && (
          <div className="mt-0.5 mb-1.5 flex flex-col">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`subnav-link ${active === g.id ? 'on' : ''}`}
                onClick={() => scrollTo(g.id, true)}
              >
                <span className="truncate">{tr(`groups.${g.id}`)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <PanelScreen
      bodyRef={body}
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
          <nav
            ref={nav}
            className="mt-3 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-4 pb-3 [scrollbar-width:none]"
          >
            {TABS.filter((x) => x.id !== 'launcher').map((x) => navItem(x.id, x.icon))}
            <div className="mt-3 flex flex-col gap-0.5">
              {navItem('launcher', 'rocket_launch')}
              {navItem('diagnostics', 'monitor_heart')}
            </div>
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
          {visibleGroups(tab.groups, ctx).map((group) => (
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
  open: (id: TabId, group?: string) => void;
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
            <GroupList
              key={group.id}
              group={group}
              rows={rows}
              ctx={ctx}
              onOpen={() => open(tab.id, group.id)}
            />
          ))}
        </section>
      ))}
    </>
  );
}
