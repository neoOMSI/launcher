import { getLanguage, t } from '../i18n';

const locale = () => (getLanguage() === 'de' ? 'de-DE' : 'en-GB');

export function hhmm(seconds: number): string {
  const s = ((Math.round(seconds) % 86400) + 86400) % 86400;
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
}

export function duration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return t('format.minutes', { m });
  if (!m) return t('format.hours', { h });
  return t('format.hoursMinutes', { h, m });
}

export const longDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(locale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const dateTime = (unixSeconds: number | bigint) =>
  new Date(Number(unixSeconds) * 1000).toLocaleString(locale(), {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export function ago(unixSeconds: number | bigint): string {
  const s = Math.max(0, Date.now() / 1000 - Number(unixSeconds));
  if (s < 90) return t('format.justNow');
  if (s < 3600) return t('format.minutesAgo', { n: Math.round(s / 60) });
  if (s < 86400 * 2) return t('format.hoursAgo', { n: Math.round(s / 3600) });
  return t('format.daysAgo', { n: Math.round(s / 86400) });
}

export function bytes(size: number | bigint): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let n = Number(size);
  let i = 0;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return `${n.toLocaleString(locale(), { maximumFractionDigits: n < 10 && i ? 1 : 0 })} ${units[i]}`;
}

export const number = (n: number | bigint, digits = 0) =>
  Number(n).toLocaleString(locale(), {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });

export const lineLabel = (name: string) => (/^\d/.test(name) ? t('format.line', { name }) : name);

export const contentName = (path: string) => {
  const parts = path.split(/[\\/]/).filter(Boolean);
  const file = parts[parts.length - 1] ?? path;
  if (/^global\.cfg$/i.test(file)) return parts[parts.length - 2] ?? file;
  return file.replace(/\.(bus|ovh|cfg)$/i, '');
};

export const percent = (fraction: number) => `${Math.round(fraction * 100)} %`;
