import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CommandArgs, ServerInfo } from '../types/launcher';

export type Season = 'auto' | 'spring' | 'summer' | 'autumn' | 'winter';

export interface CustomWeather {
  visibility: number;
  brightness: number;
  windDirection: number;
  windSpeed: number;
  temperature: number;
  humidity: number;
  clouds: string;
  precipitation: number;
  intensity: number;
  wetness: number;
  snowCover: boolean;
  snowOnRoad: boolean;
}

export interface StopSpawn {
  id: number;
  name: string;
  spawn: string;
}

export interface Choice {
  bus: string;
  paint: string;
  hof: string;
  number: string;
  plate: string;
  map: string;
  free: boolean;
  entry: number;
  stop: StopSpawn | null;
  line: string;
  tour: string;
  trip: string;
  time: string;
  date: string;
  season: Season;
  traffic: number;
  passengers: boolean;
  schedule: boolean;
  autostart: boolean;
  onFoot: boolean;
  weather: string;
  metar: string;
  custom: CustomWeather;
}

export const DEFAULT_CUSTOM: CustomWeather = {
  visibility: 20000,
  brightness: 100,
  windDirection: 270,
  windSpeed: 4,
  temperature: 15,
  humidity: 60,
  clouds: 'scattered',
  precipitation: 0,
  intensity: 0,
  wetness: 0,
  snowCover: false,
  snowOnRoad: false,
};

const DEFAULT_CHOICE: Choice = {
  bus: '',
  paint: '',
  hof: '',
  number: '',
  plate: '',
  map: '',
  free: false,
  entry: -1,
  stop: null,
  line: '',
  tour: '',
  trip: '',
  time: '09:00',
  date: '1989-05-30',
  season: 'auto',
  traffic: 30,
  passengers: true,
  schedule: true,
  autostart: false,
  onFoot: false,
  weather: '',
  metar: 'EDDB',
  custom: DEFAULT_CUSTOM,
};

const KEY = 'neoomsi.duty';

function restore(): Choice {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? { ...DEFAULT_CHOICE, ...JSON.parse(saved) } : DEFAULT_CHOICE;
  } catch {
    return DEFAULT_CHOICE;
  }
}

interface DutyValue {
  choice: Choice;
  update: (patch: Partial<Choice>) => void;
  server: ServerInfo | null;
  setServer: (server: ServerInfo | null) => void;
}

const DutyContext = createContext<DutyValue>({
  choice: DEFAULT_CHOICE,
  update() {},
  server: null,
  setServer() {},
});

export const useDuty = () => useContext(DutyContext);

export function DutyProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<Choice>(restore);
  const [server, setServer] = useState<ServerInfo | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(choice));
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [choice]);

  return (
    <DutyContext
      value={{
        choice,
        update: (patch) => setChoice((c) => ({ ...c, ...patch })),
        server,
        setServer,
      }}
    >
      {children}
    </DutyContext>
  );
}

const SEASON_MONTH: Record<Exclude<Season, 'auto'>, string> = {
  spring: '04',
  summer: '07',
  autumn: '10',
  winter: '01',
};

export const dateForSeason = (date: string, season: Season) =>
  season === 'auto' ? date : `${date.slice(0, 4)}-${SEASON_MONTH[season]}-${date.slice(8, 10)}`;

export function seasonOf(choice: Choice): Exclude<Season, 'auto'> {
  if (choice.season !== 'auto') return choice.season;
  const month = Number(choice.date.slice(5, 7));
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export function encodeCustom(c: CustomWeather): string {
  return [
    c.visibility,
    c.brightness,
    c.windDirection,
    c.windSpeed,
    c.temperature,
    c.humidity,
    c.clouds,
    c.precipitation,
    c.intensity,
    c.wetness,
    c.snowCover ? 1 : 0,
    c.snowOnRoad ? 1 : 0,
  ].join(';');
}

export function toDuty(
  choice: Choice,
  profile: string,
  server: ServerInfo | null,
): CommandArgs<'launch'> {
  const duty: CommandArgs<'launch'> = {
    map: choice.map,
    bus: choice.bus,
    paint: choice.paint || undefined,
    hof: choice.hof || undefined,
    number: choice.number || undefined,
    plate: choice.plate || undefined,
    entry: choice.entry,
    time: choice.time,
    date: choice.date,
    traffic: choice.traffic,
    passengers: choice.passengers,
    schedule: choice.schedule,
    autostart: choice.autostart,
    onFoot: choice.onFoot,
    profile,
    season: choice.season === 'auto' ? undefined : choice.season,
    weather:
      choice.weather === 'metar'
        ? `metar:${choice.metar}`
        : choice.weather === 'custom'
          ? `custom:${encodeCustom(choice.custom)}`
          : choice.weather,
  };
  if (!choice.free && choice.line) {
    duty.line = choice.line;
    duty.tour = choice.tour || undefined;
    duty.trip = choice.trip || undefined;
  }
  if (server) duty.lan = `join:${server.address}`;
  return duty;
}
