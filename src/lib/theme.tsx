import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

export interface Origin {
  x: number;
  y: number;
}

const ThemeContext = createContext<{ theme: Theme; toggle: (from?: Origin) => void }>({
  theme: 'dark',
  toggle() {},
});

export const useTheme = () => useContext(ThemeContext);

const stored = () => {
  try {
    return localStorage.getItem('theme');
  } catch {
    return null;
  }
};

const prefersLight = () => window.matchMedia('(prefers-color-scheme: light)');

// The CSP forbids the website's inline <head> script, so the first paint is themed from here.
export function applyInitialTheme() {
  document.documentElement.dataset.theme = stored() || (prefersLight().matches ? 'light' : 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const query = prefersLight();
    const follow = (e: MediaQueryListEvent) => {
      if (!stored()) setTheme(e.matches ? 'light' : 'dark');
    };
    query.addEventListener('change', follow);
    return () => query.removeEventListener('change', follow);
  }, []);

  // Every colour changes in the same frame: transitions are off while the new theme is revealed
  // as a circle growing from the toggle (a view transition), instead of each element fading late.
  const toggle = (from?: Origin) => {
    const next = theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', next);
    } catch {}
    const root = document.documentElement;
    const apply = () => {
      root.dataset.theme = next;
      flushSync(() => setTheme(next));
    };
    root.classList.add('theme-switching');
    const done = () => root.classList.remove('theme-switching');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || still) {
      apply();
      requestAnimationFrame(() => requestAnimationFrame(done));
      return;
    }
    const x = from?.x ?? window.innerWidth / 2;
    const y = from?.y ?? window.innerHeight / 2;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = document.startViewTransition(apply);
    transition.ready
      .then(() =>
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          {
            duration: 600,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        ),
      )
      .catch(() => {});
    transition.finished.finally(done);
  };

  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>;
}
