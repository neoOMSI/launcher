import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getLanguage, setLanguage, type SupportedLanguage } from '../i18n';
import type { Settings } from '../types/launcher';
import { call, errorText, useEngine } from './engine';

interface SettingsValue {
  settings: Settings | null;
  error?: string;
  saving: boolean;
  language: SupportedLanguage;
  update: (patch: Settings) => void;
  save: (patch: Settings) => Promise<void>;
  reload: () => void;
}

const SettingsContext = createContext<SettingsValue>({
  settings: null,
  saving: false,
  language: 'en',
  update() {},
  save: async () => {},
  reload() {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { ready, log } = useEngine();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [language, setLang] = useState<SupportedLanguage>(getLanguage());
  const pending = useRef<Settings>({});
  const waiting = useRef<{ resolve: () => void; reject: (err: unknown) => void }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const adopt = useCallback((next: Settings) => {
    setSettings(next);
    setError(undefined);
    if (typeof next.language === 'string' && next.language) {
      setLanguage(next.language);
      setLang(getLanguage());
    }
  }, []);

  const reload = useCallback(() => {
    if (Object.keys(pending.current).length) return;
    call('settings')
      .then(adopt)
      .catch((err) => setError(errorText(err)));
  }, [adopt]);

  useEffect(() => {
    if (ready) reload();
  }, [ready, reload]);

  // The game's pause menu writes the same settings file.
  useEffect(() => {
    window.addEventListener('focus', reload);
    return () => window.removeEventListener('focus', reload);
  }, [reload]);

  const flush = useCallback(() => {
    const patch = pending.current;
    const waiters = waiting.current;
    pending.current = {};
    waiting.current = [];
    if (!Object.keys(patch).length) return;
    setSaving(true);
    call('save_settings', patch)
      .then((saved) => {
        if (!Object.keys(pending.current).length) adopt(saved);
        for (const w of waiters) w.resolve();
      })
      .catch((err) => {
        log(`[Settings] ${errorText(err)}`);
        setError(errorText(err));
        for (const w of waiters) w.reject(err);
      })
      .finally(() => setSaving(false));
  }, [adopt, log]);

  const update = useCallback(
    (patch: Settings) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      if (typeof patch.language === 'string') {
        setLanguage(patch.language);
        setLang(getLanguage());
      }
      pending.current = { ...pending.current, ...patch };
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 350);
    },
    [flush],
  );

  const save = useCallback(
    (patch: Settings) =>
      new Promise<void>((resolve, reject) => {
        waiting.current.push({ resolve, reject });
        update(patch);
      }),
    [update],
  );

  return (
    <SettingsContext value={{ settings, error, saving, language, update, save, reload }}>
      {children}
    </SettingsContext>
  );
}
