import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

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

export type Tone = 'note' | 'tip' | 'caution';

export interface Notice {
  id: number;
  text: string;
  tone: Tone;
}

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});

const NoticeContext = createContext<{
  notice: Notice | null;
  dismiss: () => void;
  hold: (on: boolean) => void;
}>({ notice: null, dismiss() {}, hold() {} });

export const useToast = () => useContext(ToastContext);
export const useNotice = () => useContext(NoticeContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const next = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const schedule = useCallback((n: Notice) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setNotice((current) => (current?.id === n.id ? null : current)),
      n.tone === 'caution' ? 12000 : 6000,
    );
  }, []);

  const show = useCallback(
    (text: string, tone: Tone = 'note') => {
      const n = { id: ++next.current, text, tone };
      setNotice(n);
      schedule(n);
    },
    [schedule],
  );

  const dismiss = () => {
    clearTimeout(timer.current);
    setNotice(null);
  };
  const hold = (on: boolean) => {
    if (on) clearTimeout(timer.current);
    else if (notice) schedule(notice);
  };

  return (
    <ToastContext value={show}>
      <NoticeContext value={{ notice, dismiss, hold }}>{children}</NoticeContext>
    </ToastContext>
  );
}
