import React from 'react';
import { Icon } from '../../components/Icon';
import { Field, Segmented, Select, Slider, Switch } from '../../components/ui';
import { t } from '../../i18n';
import {
  DEFAULT_CUSTOM,
  dateForSeason,
  seasonOf,
  useDuty,
  type Choice,
  type CustomWeather,
  type Season,
} from '../../lib/duty';
import type { WeatherInfo } from '../../types/launcher';
import type { DriveData } from './DrivePage';

const SEASONS: Season[] = ['auto', 'spring', 'summer', 'autumn', 'winter'];

export function weatherLabel(choice: Choice, presets: WeatherInfo[]): string {
  if (choice.weather === '') return t('drive.weather.mapDefault');
  if (choice.weather === 'cycle') return t('drive.weather.cycle');
  if (choice.weather === 'metar') return t('drive.weather.metarAt', { station: choice.metar });
  if (choice.weather === 'custom') return t('drive.weather.custom');
  return presets.find((w) => w.file === choice.weather)?.name ?? choice.weather;
}

const presetIcon = (w: WeatherInfo) =>
  w.snow ? 'weather_snowy' : w.precip === 'rain' ? 'rainy' : w.fogM < 1000 ? 'foggy' : 'wb_sunny';

export function weatherIcon(choice: Choice, presets: WeatherInfo[]): string {
  if (choice.weather === '') return 'partly_cloudy_day';
  if (choice.weather === 'cycle') return 'autorenew';
  if (choice.weather === 'metar') return 'public';
  if (choice.weather === 'custom') return 'tune';
  const preset = presets.find((w) => w.file === choice.weather);
  return preset ? presetIcon(preset) : 'partly_cloudy_day';
}

const pad = (n: number) => String(n).padStart(2, '0');

function now(): Pick<Choice, 'time' | 'date' | 'season'> {
  const d = new Date();
  return {
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    season: 'auto',
  };
}

const fits = (w: WeatherInfo, season: Exclude<Season, 'auto'>) =>
  season === 'winter' ? w.temp < 12 : season === 'summer' ? !w.snow && w.temp > 5 : !w.snow;

export const TimeStep: React.FC<{ data: DriveData }> = ({ data }) => {
  const { choice, update, server } = useDuty();

  if (server) {
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 font-semibold text-heading">
          <Icon name="lock" size={18} />
          {t('drive.time.setBy', { server: server.name })}
        </p>
        <p className="text-muted">
          {server.time} · {server.weather}
        </p>
        <p className="max-w-[34em] text-[15px] text-muted">{t('drive.time.serverHint')}</p>
      </div>
    );
  }

  const season = seasonOf(choice);
  const presets = data.weather.filter((w) => fits(w, season));
  const options: [string, string, string, string][] = [
    ['', 'map', t('drive.weather.mapDefault'), t('drive.weather.mapDefaultHint')],
    ['cycle', 'autorenew', t('drive.weather.cycle'), t('drive.weather.cycleHint')],
    ['metar', 'public', t('drive.weather.metar'), t('drive.weather.metarHint')],
    ['custom', 'tune', t('drive.weather.custom'), t('drive.weather.customHint')],
    ...presets.map(
      (w) =>
        [
          w.file,
          presetIcon(w),
          w.name,
          `${Math.round(w.temp)} °C · ${w.fogM >= 10000 ? `${w.fogM / 1000} km` : `${w.fogM} m`}`,
        ] as [string, string, string, string],
    ),
  ];

  return (
    <div className="space-y-8">
      <section>
        <div className="relative grid grid-cols-2 gap-x-6 gap-y-5">
          <Field label={t('drive.time.time')}>
            <input
              type="time"
              className="input"
              value={choice.time}
              onChange={(e) => update({ time: e.target.value, trip: '' })}
            />
          </Field>
          <Field label={t('drive.time.date')}>
            <input
              type="date"
              className="input"
              value={choice.date}
              onChange={(e) => e.target.value && update({ date: e.target.value, season: 'auto' })}
            />
          </Field>
          <button
            type="button"
            className="absolute top-0 right-0 flex items-center gap-1 text-[14px] font-semibold text-brand hover:underline"
            title={t('drive.time.nowHint')}
            onClick={() => update({ ...now(), trip: '' })}
          >
            <Icon name="schedule" size={16} />
            {t('drive.time.now')}
          </button>
        </div>
        <div className="mt-5">
          <Segmented
            fill
            label={t('drive.time.season')}
            options={SEASONS.map((s) => [s, t(`drive.time.seasons.${s}`)] as const)}
            value={choice.season}
            onChange={(s) => update({ season: s, date: dateForSeason(choice.date, s) })}
          />
        </div>
      </section>

      <section>
        <div className="divide-y divide-line">
          <div className="flex items-center gap-6 py-2.5 text-[15px]">
            <span className="w-48 shrink-0">{t('drive.time.traffic')}</span>
            <Slider
              value={choice.traffic}
              min={0}
              max={120}
              onChange={(traffic) => update({ traffic })}
            />
          </div>
          {(
            [
              ['passengers', 'drive.time.passengers'],
              ['schedule', 'drive.time.schedule'],
              ['autostart', 'drive.time.autostart'],
              ['onFoot', 'drive.time.onFoot'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-6 py-2.5 text-[15px]">
              <span>{t(label)}</span>
              <Switch checked={choice[key]} onChange={(v) => update({ [key]: v })} />
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[16px] font-semibold text-heading">{t('drive.weather.title')}</h3>
        <div className="flex flex-col gap-0.5">
          {options.map(([value, icon, name]) => (
            <button
              key={value}
              type="button"
              className="option"
              aria-pressed={choice.weather === value}
              onClick={() => update({ weather: value })}
            >
              <Icon name={icon} size={18} />
              <span className="min-w-0 flex-1 truncate text-[15px]">{name}</span>
            </button>
          ))}
        </div>
        {choice.weather === 'metar' && (
          <div className="mt-5 max-w-56">
            <Field label={t('drive.weather.airport')}>
              <input
                className="input font-mono uppercase"
                maxLength={4}
                placeholder="ICAO"
                value={choice.metar}
                onChange={(e) => update({ metar: e.target.value.toUpperCase() })}
              />
            </Field>
          </div>
        )}
        {choice.weather === 'custom' && <CustomEditor />}
      </section>
    </div>
  );
};

function CustomEditor() {
  const { choice, update } = useDuty();
  const c = choice.custom ?? DEFAULT_CUSTOM;
  const set = (patch: Partial<CustomWeather>) => update({ custom: { ...c, ...patch } });
  const sliders: [keyof CustomWeather, number, number, number, (v: number) => string][] = [
    [
      'visibility',
      50,
      50000,
      50,
      (v) => (v >= 50000 ? '∞' : v >= 1000 ? `${(v / 1000).toFixed(1)} km` : `${v} m`),
    ],
    ['brightness', 0, 150, 1, (v) => `${v} %`],
    ['windDirection', 0, 355, 5, (v) => `${v}°`],
    ['windSpeed', 0, 40, 1, (v) => `${v} m/s`],
    ['temperature', -30, 45, 1, (v) => `${v} °C`],
    ['humidity', 0, 100, 1, (v) => `${v} %`],
    ['intensity', 0, 255, 1, String],
    ['wetness', 0, 100, 1, (v) => `${v} %`],
  ];
  return (
    <div className="mt-6 rounded-xl border border-line p-5">
      <div className="divide-y divide-line">
        {sliders.map(([key, min, max, step, format]) => (
          <div key={key} className="flex items-center gap-8 py-3">
            <span className="w-44 shrink-0">{t(`drive.weather.fields.${key}`)}</span>
            <Slider
              value={c[key] as number}
              min={min}
              max={max}
              step={step}
              format={format}
              onChange={(v) => set({ [key]: v })}
            />
          </div>
        ))}
        <div className="flex items-center gap-8 py-3">
          <span className="w-44 shrink-0">{t('drive.weather.fields.clouds')}</span>
          <Select
            value={c.clouds}
            options={['none', 'few', 'scattered', 'broken', 'overcast', 'stratus'].map(
              (v) => [v, t(`drive.weather.clouds.${v}`)] as const,
            )}
            onChange={(clouds) => set({ clouds })}
          />
        </div>
        <div className="flex items-center gap-8 py-3">
          <span className="w-44 shrink-0">{t('drive.weather.fields.precipitation')}</span>
          <Segmented
            options={(['0', '1', '2'] as const).map(
              (v) => [v, t(`drive.weather.precip.${v}`)] as const,
            )}
            value={String(c.precipitation) as '0' | '1' | '2'}
            onChange={(v) => set({ precipitation: Number(v) })}
          />
        </div>
        {(['snowCover', 'snowOnRoad'] as const).map((key) => (
          <label key={key} className="flex items-center justify-between gap-8 py-3">
            <span>{t(`drive.weather.fields.${key}`)}</span>
            <Switch checked={c[key]} onChange={(v) => set({ [key]: v })} />
          </label>
        ))}
      </div>
    </div>
  );
}
