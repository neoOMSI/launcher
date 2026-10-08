import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { useNotice, type Tone } from '../lib/nav';
import { useTheme } from '../lib/theme';
import { Icon } from './Icon';
import wordmark from '../../assets/logos/wordmark-gradient-dark.svg';
import wordmarkLight from '../../assets/logos/wordmark-gradient-light.svg';

const GLYPH = {
  minimize: <path d="M0 5.5h10" />,
  maximize: <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" />,
  restore: (
    <>
      <rect x="0.5" y="2.5" width="7" height="7" rx="1.5" />
      <path d="M2.5 2.5V2a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 9.5 2v4A1.5 1.5 0 0 1 8 7.5h-.5" />
    </>
  ),
  close: <path d="M0.5 0.5l9 9M9.5 0.5l-9 9" />,
};

function WindowButton({
  glyph,
  label,
  onClick,
  danger,
}: {
  glyph: keyof typeof GLYPH;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`win-btn ${danger ? 'win-close' : ''}`}
    >
      <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor">
        {GLYPH[glyph]}
      </svg>
    </button>
  );
}

const TONE: Record<Tone, [string, string]> = {
  tip: ['check_circle', 'var(--color-ok)'],
  caution: ['cancel', 'var(--color-danger)'],
  note: ['warning', 'var(--color-warn)'],
};

function Status() {
  const { notice, dismiss, hold } = useNotice();
  const [icon, colour] = notice ? TONE[notice.tone] : [];
  return (
    <div role="status" aria-live="polite" className="flex min-w-0 flex-1 items-center pr-6 pl-10">
      {notice && (
        <button
          key={notice.id}
          type="button"
          className="notice no-drag"
          title={notice.text}
          onClick={dismiss}
          onPointerEnter={() => hold(true)}
          onPointerLeave={() => hold(false)}
        >
          <Icon name={icon!} size={18} style={{ color: colour, flexShrink: 0 }} />
          <span className="truncate">{notice.text}</span>
        </button>
      )}
    </div>
  );
}

export function TitleBar() {
  const bridge = typeof window === 'undefined' ? undefined : window.neoomsi;
  const mac = bridge?.platform === 'darwin';
  const [maximized, setMaximized] = useState(false);
  const { theme, toggle } = useTheme();
  const light = theme === 'light';

  useEffect(() => {
    if (!bridge?.window) return;
    bridge.window.isMaximized().then(setMaximized);
    return bridge.window.onMaximized(setMaximized);
  }, [bridge]);

  return (
    <header
      className="drag flex h-12 shrink-0 items-center"
      onDoubleClick={(e) => {
        if (e.target === e.currentTarget && !mac) bridge?.window.toggleMaximize();
      }}
    >
      <div className={`flex w-64 shrink-0 items-center gap-5 ${mac ? 'pl-[5.5rem]' : 'pl-8'}`}>
        <span className="pointer-events-none flex">
          <img className="logo-dark h-[18px] w-auto" src={wordmark} alt={t('app.brandingAlt')} />
          <img
            className="logo-light h-[18px] w-auto"
            src={wordmarkLight}
            alt={t('app.brandingAlt')}
          />
        </span>
        <button
          type="button"
          className="theme-toggle size-8 rounded-full"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
          }}
          aria-label={light ? t('theme.toDark') : t('theme.toLight')}
          title={light ? t('theme.toDark') : t('theme.toLight')}
        >
          <Icon name={light ? 'dark_mode' : 'light_mode'} size={18} />
        </button>
      </div>
      <Status />
      {!mac && bridge?.window && (
        <div className="no-drag flex items-center gap-1 pr-2">
          <WindowButton
            glyph="minimize"
            label={t('window.minimize')}
            onClick={() => bridge.window.minimize()}
          />
          <WindowButton
            glyph={maximized ? 'restore' : 'maximize'}
            label={maximized ? t('window.restore') : t('window.maximize')}
            onClick={() => bridge.window.toggleMaximize()}
          />
          <WindowButton
            glyph="close"
            label={t('window.close')}
            onClick={() => bridge.window.close()}
            danger
          />
        </div>
      )}
    </header>
  );
}
