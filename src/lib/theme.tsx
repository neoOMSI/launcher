import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
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

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', next);
    } catch {}
    setTheme(next);
  };

  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>;
}
