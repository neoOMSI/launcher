import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Notice, Segmented, Select, Spinner, Switch } from '../../components/ui';
import { call, errorText, useCommand, useEngine } from '../../lib/engine';
import { useToast } from '../../lib/nav';
import { useTheme } from '../../lib/theme';
import type { AppInfo, LauncherPrefs, OnLaunch } from '../../types/neoomsi';
import type { GameRelease } from '../../types/launcher';
import { Changelog } from '../../components/Changelog';
import type { CustomProps } from './rows';
import { tr, type CustomId } from './schema';

export type ThemeChoice = 'light' | 'dark' | 'system';

const REPO = 'https://github.com/neoOMSI/neoOMSI';

const PREF_DEFAULTS: Pick<LauncherPrefs, 'onLaunch' | 'restoreOnExit'> = {
  onLaunch: 'minimize',
  restoreOnExit: true,
};

const bridge = () => (typeof window !== 'undefined' ? window.neoomsi : undefined);

const storedTheme = (): ThemeChoice => {
  try {
    const v = localStorage.getItem('theme');
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
};

interface LauncherValue {
  prefs: LauncherPrefs | null;
  setPrefs: (patch: Partial<LauncherPrefs>) => void;
  theme: ThemeChoice;
  setTheme: (choice: ThemeChoice) => void;
  reset: () => void;
}

const LauncherContext = createContext<LauncherValue | null>(null);

const useLauncher = () => useContext(LauncherContext)!;

export function LauncherProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const { theme: shown, toggle } = useTheme();
  const [prefs, setLocal] = useState<LauncherPrefs | null>(null);
  const [theme, setChoice] = useState(storedTheme);

  useEffect(() => {
    bridge()
      ?.prefs.get()
      .then(setLocal)
      .catch((err) => toast(errorText(err), 'caution'));
  }, [toast]);

  // The sidebar's toggle pins a theme of its own.
  useEffect(() => setChoice(storedTheme()), [shown]);

  const setPrefs = useCallback(
    (patch: Partial<LauncherPrefs>) => {
      setLocal((p) => (p ? { ...p, ...patch } : p));
      bridge()
        ?.prefs.set(patch)
        .then(setLocal)
        .catch((err) => toast(errorText(err), 'caution'));
    },
    [toast],
  );

  const setTheme = (choice: ThemeChoice) => {
    const want =
      choice === 'system'
        ? window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'
        : choice;
    if (want !== shown) toggle();
    try {
      if (choice === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', choice);
    } catch {}
    setChoice(choice);
  };

  const reset = () => {
    setTheme('system');
    if (prefs) setPrefs(PREF_DEFAULTS);
  };

  return (
    <LauncherContext value={{ prefs, setPrefs, theme, setTheme, reset }}>
      {children}
    </LauncherContext>
  );
}

export const useLauncherReset = () => useLauncher().reset;

const Theme: React.FC<CustomProps> = () => {
  const { theme, setTheme } = useLauncher();
  return (
    <Segmented<ThemeChoice>
      fill
      label={tr('rows.theme')}
      value={theme}
      options={(['light', 'dark', 'system'] as const).map((v) => [v, tr(`themes.${v}`)] as const)}
      onChange={setTheme}
    />
  );
};

const OnLaunchSelect: React.FC<CustomProps> = () => {
  const { prefs, setPrefs } = useLauncher();
  return (
    <Select<OnLaunch>
      value={prefs?.onLaunch ?? PREF_DEFAULTS.onLaunch}
      disabled={!prefs}
      label={tr('rows.on_launch')}
      options={(['keep', 'minimize', 'hide'] as const).map(
        (v) => [v, tr(`onLaunch.${v}`)] as const,
      )}
      onChange={(onLaunch) => setPrefs({ onLaunch })}
    />
  );
};

const RestoreOnExit: React.FC<CustomProps> = () => {
  const { prefs, setPrefs } = useLauncher();
  return (
    <Switch
      checked={prefs?.restoreOnExit ?? PREF_DEFAULTS.restoreOnExit}
      disabled={!prefs || prefs.onLaunch === 'keep'}
      label={tr('rows.restore_on_exit')}
      onChange={(restoreOnExit) => setPrefs({ restoreOnExit })}
    />
  );
};

const Folder: React.FC<CustomProps> = () => {
  const toast = useToast();
  const config = useCommand('config');
  const [busy, setBusy] = useState(false);
  const root = config.data?.root ?? '';

  if (config.error)
    return (
      <Notice tone="caution" icon="error" title={tr('folder.failed')}>
        <p className="select-text">{config.error}</p>
      </Notice>
    );
  if (config.loading && !config.data) return <Spinner label={tr('folder.loading')} />;

  const change = async () => {
    const picked = await bridge()?.pickFolder(root || undefined);
    if (!picked || picked === root) return;
    setBusy(true);
    try {
      await call('save_config', { root: picked });
      toast(tr('folder.changed'), 'tip');
    } catch (err) {
      toast(errorText(err), 'caution');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="grid size-11 shrink-0 place-items-center text-muted">
        <Icon name="folder" size={30} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-heading select-text" title={root}>
          {root || tr('folder.none')}
        </p>
        {config.data?.game && (
          <p className="mt-0.5 text-[14px] text-muted">
            {tr('folder.game', { game: config.data.game })}
          </p>
        )}
      </div>
      <button
        type="button"
        className="theme-toggle"
        aria-label={tr('folder.open')}
        title={tr('folder.open')}
        disabled={!root || !bridge()}
        onClick={() =>
          bridge()
            ?.openPath(root)
            .catch((err) => toast(errorText(err), 'caution'))
        }
      >
        <Icon name="folder_open" size={20} />
      </button>
      <button
        type="button"
        className="btn-quiet"
        disabled={busy || !bridge()}
        onClick={() => void change()}
      >
        {tr('folder.change')}
      </button>
    </div>
  );
};

type Check =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'done'; latest: GameRelease | null }
  | { state: 'failed'; error: string };

const openExternal = (url: string) => {
  const b = bridge();
  if (b) void b.openExternal(url);
  else window.open(url, '_blank', 'noopener');
};

const CheckUpdates: React.FC<CustomProps> = () => {
  const { status } = useEngine();
  const version = status.engineVersion;
  const [check, setCheck] = useState<Check>({ state: 'idle' });

  const run = () => {
    if (!version) return;
    setCheck({ state: 'checking' });
    call('update_check')
      .then((latest) => setCheck({ state: 'done', latest }))
      .catch((err) => setCheck({ state: 'failed', error: errorText(err) }));
  };

  const latest = check.state === 'done' ? check.latest : null;

  return (
    <div>
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <p className="text-ink">
            {version ? tr('updates.current', { version }) : tr('updates.noVersion')}
          </p>
          {check.state === 'done' && !latest && (
            <p className="mt-0.5 flex items-center gap-1.5 text-[14.5px] text-ok">
              <Icon name="check_circle" size={16} />
              {tr('updates.upToDate')}
            </p>
          )}
          {!bridge() && <p className="mt-0.5 text-[14.5px] text-muted">{tr('desktopOnly')}</p>}
        </div>
        <button
          type="button"
          className="btn-quiet shrink-0 gap-2"
          disabled={!version || check.state === 'checking'}
          onClick={run}
        >
          {check.state === 'checking' ? (
            <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-brand" />
          ) : (
            <Icon name="refresh" size={18} />
          )}
          {check.state === 'checking' ? tr('updates.checking') : tr('updates.check')}
        </button>
      </div>
      {check.state === 'failed' && (
        <Notice tone="caution" icon="error" title={tr('updates.failed')} className="mt-4">
          <p className="select-text">{check.error}</p>
        </Notice>
      )}
      {latest && (
        <Notice
          tone="tip"
          icon="new_releases"
          title={tr('updates.available', { version: latest.version })}
          className="mt-4"
        >
          {latest.prerelease && <Badge color="var(--color-warn)">{tr('updates.prerelease')}</Badge>}
          {latest.notes.trim() && (
            <Changelog notes={latest.notes} className="mt-3 max-h-56 overflow-y-auto pr-2" />
          )}
          <button
            type="button"
            className="btn mt-4 gap-2"
            onClick={() => openExternal(latest.page || `${REPO}/releases`)}
          >
            <Icon name="open_in_new" size={18} />
            {tr('updates.open')}
          </button>
        </Notice>
      )}
    </div>
  );
};

const About: React.FC<CustomProps> = () => {
  const toast = useToast();
  const { status } = useEngine();
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    bridge()
      ?.appInfo()
      .then(setInfo)
      .catch(() => {});
  }, []);

  const rows: [string, ReactNode][] = [
    [tr('about.launcher'), info?.version ?? '–'],
    [tr('about.engine'), status.engineVersion ?? tr('about.unknown')],
    ...(info
      ? ([
          [tr('about.electron'), `${info.electron} · Chromium ${info.chrome}`],
          [tr('about.system'), `${info.platform} ${info.arch}`],
          [
            tr('about.data'),
            <button
              type="button"
              className="link max-w-full truncate text-left font-mono text-[14px]"
              title={info.userData}
              onClick={() =>
                bridge()
                  ?.openPath(info.userData)
                  .catch((err) => toast(errorText(err), 'caution'))
              }
            >
              {info.userData}
            </button>,
          ],
        ] as [string, ReactNode][])
      : []),
  ];

  return (
    <div>
      <dl className="grid grid-cols-[10rem_minmax(0,1fr)] gap-x-6 gap-y-2 text-[15.5px]">
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="text-muted">{label}</dt>
            <dd className="min-w-0 truncate text-ink select-text">{value}</dd>
          </React.Fragment>
        ))}
      </dl>
      <button type="button" className="btn-quiet mt-6 gap-2" onClick={() => openExternal(REPO)}>
        <Icon name="open_in_new" size={18} />
        github.com/neoOMSI/neoOMSI
      </button>
    </div>
  );
};

export const LAUNCHER_CUSTOM: Pick<
  Record<CustomId, React.FC<CustomProps>>,
  'theme' | 'onLaunch' | 'restoreOnExit' | 'folder' | 'checkUpdates' | 'about'
> = {
  theme: Theme,
  onLaunch: OnLaunchSelect,
  restoreOnExit: RestoreOnExit,
  folder: Folder,
  checkUpdates: CheckUpdates,
  about: About,
};
