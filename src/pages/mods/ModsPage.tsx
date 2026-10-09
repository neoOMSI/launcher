import React, { useEffect, useRef, useState, type DragEvent } from 'react';
import { Icon } from '../../components/Icon';
import { PanelScreen } from '../../components/Screen';
import { Notice, Spinner } from '../../components/ui';
import { t } from '../../i18n';
import { errorText, invalidate, useCommand } from '../../lib/engine';
import { bytes } from '../../lib/format';
import { useNav, useToast } from '../../lib/nav';
import { Folders } from './Folders';
import { Installed } from './Installed';
import { Installing } from './Installing';
import { enqueue, isRunning, readMods } from './logic';
import { Preflight } from './Preflight';

type Section = 'installed' | 'installing' | 'folders';

const SECTIONS: readonly (readonly [Section, string])[] = [
  ['installed', 'extension'],
  ['installing', 'download'],
  ['folders', 'folder_open'],
];

const hasFiles = (e: DragEvent) => e.dataTransfer.types.includes('Files');

export const ModsPage: React.FC = () => {
  const mods = useCommand('mods');
  const { route, go } = useNav();
  const toast = useToast();
  const [queue, setQueue] = useState<string[]>([]);
  const [handled, setHandled] = useState(0);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const data = mods.data ? readMods(mods.data) : null;
  const section: Section =
    route.section === 'installing' || route.section === 'folders' ? route.section : 'installed';
  const running = data?.jobs.filter(isRunning).length ?? 0;

  const wasRunning = useRef(running > 0);
  useEffect(() => {
    if (wasRunning.current && !running) invalidate('maps', 'vehicles', 'weather');
    wasRunning.current = running > 0;
  }, [running]);

  const add = (paths: string[]) => setQueue((q) => enqueue(q, paths));

  const next = () => {
    if (queue.length <= 1) {
      setHandled(0);
      setQueue([]);
    } else {
      setHandled((n) => n + 1);
      setQueue((q) => q.slice(1));
    }
  };

  const pickFiles = () =>
    window.neoomsi
      ?.pickFiles('mod', true)
      .then(add)
      .catch((err) => toast(errorText(err), 'caution'));

  const pickFolder = () =>
    window.neoomsi
      ?.pickFolder()
      .then((p) => p && add([p]))
      .catch((err) => toast(errorText(err), 'caution'));

  const open = (path: string) =>
    window.neoomsi?.openPath(path).catch((err) => toast(errorText(err), 'caution'));

  const drag = {
    onDragEnter: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    onDragOver: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (!depth.current) setDragging(false);
    },
    onDrop: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      const bridge = window.neoomsi;
      if (bridge) add(Array.from(e.dataTransfer.files, (f) => bridge.pathForFile(f)));
    },
  };

  const counts: Record<Section, number | null> = {
    installed: data ? data.installed.length : null,
    installing: running || null,
    folders: null,
  };

  return (
    <div className="relative flex min-h-0 flex-1" {...drag}>
      <PanelScreen
        panel={
          <>
            <div className="shrink-0 px-6 pt-6">
              <h2 className="section-title text-[1.6rem]">{t('nav.mods')}</h2>
              <button
                type="button"
                className="btn mt-5 h-11 w-full justify-center gap-2 rounded-full"
                onClick={pickFiles}
              >
                <Icon name="add" size={20} />
                {t('mods.installMod')}
              </button>
              <p className="mt-2.5 text-center text-[14px] text-muted">
                {t('mods.dropHint')}{' '}
                <button
                  type="button"
                  className="underline-offset-[3px] hover:text-ink hover:underline"
                  onClick={pickFolder}
                >
                  {t('mods.chooseFolder')}
                </button>
              </p>
            </div>
            <nav className="mt-5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 [scrollbar-width:none]">
              {SECTIONS.map(([id, icon]) => {
                const on = id === section;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-current={on ? 'page' : undefined}
                    className={`nav-link ${on ? 'on' : ''}`}
                    onClick={() => go('mods', id)}
                  >
                    <Icon name={icon} size={20} />
                    <span className="min-w-0 flex-1 truncate">{t(`mods.sections.${id}`)}</span>
                    {counts[id] !== null && (
                      <span className="text-[14px] font-normal text-muted tabular-nums">
                        {counts[id]}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            {data && (
              <div className="shrink-0 px-4 pt-2 pb-4">
                <p className="flex items-center gap-2 px-3 text-[14px] text-muted">
                  <Icon name="hard_drive" size={16} />
                  {t('mods.free', { size: bytes(data.freeBytes) })}
                </p>
                <button
                  type="button"
                  className="mt-1 flex h-10 w-full items-center gap-2 rounded-full px-3 text-[14.5px] text-muted transition-colors hover:bg-sunken hover:text-ink"
                  disabled={!data.contentDir}
                  onClick={() => open(data.contentDir)}
                >
                  <Icon name="folder_open" size={18} />
                  {t('mods.openContent')}
                </button>
              </div>
            )}
          </>
        }
      >
        <div className="mx-auto max-w-[52rem]">
          {!data ? (
            mods.error ? (
              <Notice tone="caution" icon="error" title={t('mods.loadFailed')}>
                <p className="select-text">{mods.error}</p>
              </Notice>
            ) : (
              <Spinner label={t('mods.reading')} />
            )
          ) : section === 'installing' ? (
            <Installing jobs={data.jobs} />
          ) : section === 'folders' ? (
            <Folders mods={data} onOpen={open} />
          ) : (
            <Installed mods={data.installed} cleaned={data.cleaned} />
          )}
        </div>
      </PanelScreen>

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-30 mr-3 mb-3 grid place-items-center rounded-3xl bg-page/80 backdrop-blur-sm">
          <p className="flex items-center gap-3 font-display text-[1.6rem] font-bold tracking-tight text-heading">
            <Icon name="download" size={28} />
            {t('mods.dropOverlay')}
          </p>
        </div>
      )}
      {queue.length > 0 && (
        <Preflight
          key={queue[0]}
          path={queue[0]}
          position={handled + 1}
          total={handled + queue.length}
          onStarted={() => go('mods', 'installing')}
          onDone={next}
        />
      )}
    </div>
  );
};
