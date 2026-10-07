import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { t } from '../i18n';

export type PageId =
  | 'drive'
  | 'multiplayer'
  | 'tutorials'
  | 'mods'
  | 'timetables'
  | 'profile'
  | 'sessions'
  | 'settings'
  | 'controls';

export interface Route {
  page: PageId;
  section?: string;
}

const NavContext = createContext<{ route: Route; go: (page: PageId, section?: string) => void }>({
  route: { page: 'drive' },
  go() {},
});

export const useNav = () => useContext(NavContext);

export function NavProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ page: 'drive' });
  return (
    <NavContext value={{ route, go: (page, section) => setRoute({ page, section }) }}>
      {children}
    </NavContext>
  );
}

type Tone = 'note' | 'tip' | 'caution';

interface Toast {
  id: number;
  text: string;
  tone: Tone;
}

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});

export const useToast = () => useContext(ToastContext);

const TONE_ICON: Record<Tone, string> = { note: 'info', tip: 'check_circle', caution: 'error' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);
  const dismiss = (id: number) => setToasts((all) => all.filter((t) => t.id !== id));

  const show = useCallback((text: string, tone: Tone = 'note') => {
    const id = ++next.current;
    setToasts((all) => [...all.slice(-2), { id, text, tone }]);
    if (tone !== 'caution') setTimeout(() => dismiss(id), 6000);
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <div className="pointer-events-none fixed right-6 bottom-6 z-50 flex w-[24rem] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`callout callout-${toast.tone} pointer-events-auto flex items-start gap-3 bg-raised py-3 pr-3 text-[15px] shadow-lg`}
          >
            <span className="mt-0.5" style={{ color: 'var(--c)' }}>
              <Icon name={TONE_ICON[toast.tone]} size={18} />
            </span>
            <span className="min-w-0 flex-1 select-text">{toast.text}</span>
            <button
              type="button"
              className="theme-toggle size-7"
              aria-label={t('common.dismiss')}
              onClick={() => dismiss(toast.id)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
