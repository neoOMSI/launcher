import en from './en.json';
import de from './de.json';

export type SupportedLanguage = 'en' | 'de';

const translations: Record<SupportedLanguage, Record<string, unknown>> = {
  en,
  de,
};

export function normalizeLanguage(code?: string | null): SupportedLanguage {
  if (!code) {
    return 'en';
  }
  const clean = code.trim().toLowerCase();
  if (clean.startsWith('de')) {
    return 'de';
  }
  return 'en';
}

let currentLanguage: SupportedLanguage = determineInitialLanguage();

function determineInitialLanguage(): SupportedLanguage {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return normalizeLanguage(navigator.language);
  }
  return 'en';
}

function resolveNestedKey(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

export function interpolate(
  template: string,
  params?: Record<string, string | number | undefined | null>,
): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return key in params && params[key] !== undefined && params[key] !== null
      ? String(params[key])
      : match;
  });
}

export function translate(
  key: string,
  params?: Record<string, string | number | undefined | null>,
): string {
  const primary = resolveNestedKey(translations[currentLanguage], key);
  if (primary !== undefined) {
    return interpolate(primary, params);
  }

  const fallback = resolveNestedKey(translations.en, key);
  if (fallback !== undefined) {
    return interpolate(fallback, params);
  }

  return key;
}

export function setLanguage(lang: string): void {
  currentLanguage = normalizeLanguage(lang);
}

export function getLanguage(): SupportedLanguage {
  return currentLanguage;
}

export const t = translate;
