import type {
  Controller,
  IbisInfo,
  KeyBindings,
  LineInfo,
  MapInfo,
  Minimap,
  ModsStatus,
  Profile,
  ServerInfo,
  Session,
  Settings,
  StopInfo,
  TourInfo,
  TripInfo,
  Tutorial,
  VehicleInfo,
  WeatherInfo,
} from '../../src/types/launcher';
import { pageDefaults } from '../../src/fixtures/settings';

export const CONFIG = {
  root: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\OMSI 2',
  game: 'neoomsi.exe',
  profile: 'Jakob Weber',
};

export const MAPS: MapInfo[] = [
  {
    name: 'Grundorf',
    friendly: 'Grundorf',
    file: 'maps/Grundorf/global.cfg',
    description:
      'A small fictional town for learning the ropes: three lines, a station and a market square.',
    entry_points: [
      { index: 0, name: 'Depot' },
      { index: 1, name: 'Hauptbahnhof' },
      { index: 2, name: 'Marktplatz' },
    ],
    hof: 'Grundorf.hof',
    installed: true,
  },
  {
    name: 'Berlin-Spandau',
    friendly: 'Berlin-Spandau 1989',
    file: 'maps/Berlin-Spandau/global.cfg',
    description:
      'West Berlin in 1989: the double-decker lines around the Spandau old town, with real timetables.',
    entry_points: [
      { index: 0, name: 'Betriebshof Spandau' },
      { index: 1, name: 'Rathaus Spandau' },
    ],
    hof: 'Spandau 1989.hof',
    installed: true,
  },
  {
    name: 'Neuhausen',
    friendly: 'Neuhausen',
    file: 'maps/Neuhausen/global.cfg',
    description: 'A community map of a southern German town with regional lines.',
    entry_points: [{ index: 0, name: 'ZOB' }],
    hof: 'Neuhausen.hof',
    installed: true,
  },
];

const vehicle = (v: Partial<VehicleInfo> & Pick<VehicleInfo, 'name' | 'manufacturer'>) =>
  ({
    type_name: v.name,
    file: `Vehicles/${v.manufacturer}/${v.name}.bus`,
    folder: v.manufacturer,
    description: '',
    default_paint: 'Default paint',
    paints: ['Default paint'],
    hofs: ['Grundorf.hof', 'Spandau 1989.hof'],
    installed: false,
    missing_packs: [],
    numbers: [],
    ...v,
  }) satisfies VehicleInfo;

export const VEHICLES: VehicleInfo[] = [
  vehicle({
    name: 'MAN SD200 (SD80)',
    manufacturer: 'MAN',
    type_name: 'SD200 (SD80)',
    description: 'The Berlin double-decker of the late 1970s: two doors, 4-speed automatic.',
    default_paint: 'BVG beige',
    paints: ['BVG beige', 'BVG beige (advert "Pop")', 'Grundorf white', 'Spandau jubilee'],
    numbers: [
      ['2401', 'B-V 2401'],
      ['2417', 'B-V 2417'],
      ['2452', 'B-V 2452'],
    ],
  }),
  vehicle({
    name: 'MAN SD202 (D92)',
    manufacturer: 'MAN',
    type_name: 'SD202 (D92)',
    description: 'The 1985 successor with a lower floor and the new BVG livery.',
    default_paint: 'BVG beige',
    paints: ['BVG beige', 'BVG corporate'],
    numbers: [
      ['3001', 'B-V 3001'],
      ['3018', 'B-V 3018'],
    ],
  }),
  vehicle({
    name: 'MAN SL200',
    manufacturer: 'MAN',
    type_name: 'SL200',
    description: 'The standard city single-decker, manual or automatic gearbox.',
    default_paint: 'Grundorf white',
    paints: ['Grundorf white', 'VÖV green', 'Hamburg red'],
  }),
  vehicle({
    name: 'MAN NL202',
    manufacturer: 'MAN',
    type_name: 'NL202 (2-door)',
    description: 'Low-floor single-decker of the early 1990s.',
    default_paint: 'Grundorf white',
    paints: ['Grundorf white', 'Neuhausen yellow', 'Regional blue', 'Plain white', 'Red', 'Advert'],
  }),
  vehicle({
    name: 'Mercedes-Benz O 530',
    manufacturer: 'Mercedes-Benz',
    type_name: 'O 530 Citaro',
    file: 'Vehicles/O530/O530.bus',
    folder: 'O530',
    description: 'A community repaint pack of the first Citaro generation.',
    installed: true,
    default_paint: 'Factory white',
    paints: ['Factory white', 'Neuhausen yellow'],
    missing_packs: ['Citaro sound pack 2.1'],
  }),
  vehicle({
    name: 'Neoplan N 4016',
    manufacturer: 'Neoplan',
    type_name: 'N 4016',
    file: 'Vehicles/N4016/N4016.bus',
    folder: 'N4016',
    description: 'Centroliner predecessor with the characteristic big windscreen.',
    installed: true,
    paints: ['Default paint', 'Regional blue'],
  }),
  vehicle({
    name: 'Volvo 7700',
    manufacturer: 'Volvo',
    type_name: '7700',
    file: 'Vehicles/Volvo7700/7700.bus',
    folder: 'Volvo7700',
    description: 'Swedish low-floor single-decker.',
    installed: true,
  }),
];

export const WEATHER: WeatherInfo[] = [
  {
    name: 'Clear summer morning',
    file: 'weather\\clear_summer.owt',
    description: '',
    fog_m: 50000,
    temp: 21,
    clouds: 'none',
    precip: 'dry',
    snow: false,
    installed: true,
  },
  {
    name: 'Overcast',
    file: 'weather\\overcast.owt',
    description: '',
    fog_m: 12000,
    temp: 14,
    clouds: 'overcast',
    precip: 'dry',
    snow: false,
    installed: true,
  },
  {
    name: 'Autumn rain',
    file: 'weather\\autumn_rain.owt',
    description: '',
    fog_m: 4000,
    temp: 9,
    clouds: 'overcast',
    precip: 'rain',
    snow: false,
    installed: true,
  },
  {
    name: 'Morning fog',
    file: 'weather\\fog.owt',
    description: '',
    fog_m: 300,
    temp: 6,
    clouds: 'stratus',
    precip: 'dry',
    snow: false,
    installed: true,
  },
  {
    name: 'Winter snowfall',
    file: 'weather\\snowfall.owt',
    description: '',
    fog_m: 1500,
    temp: -3,
    clouds: 'overcast',
    precip: 'snow',
    snow: true,
    installed: true,
  },
];

interface LineDef {
  name: string;
  stops: string[];
  minutes: number;
  tours: number;
  firstDeparture: number;
  headway: number;
  days: string;
  km: number;
  trips?: number;
  aiOnly?: boolean;
}

const LINE_DEFS: Record<string, LineDef[]> = {
  Grundorf: [
    {
      name: '24',
      stops: ['Hauptbahnhof', 'Lindenallee', 'Marktplatz', 'Schulzentrum', 'Rathaus'],
      minutes: 3,
      tours: 4,
      firstDeparture: 5 * 3600 + 12 * 60,
      headway: 30,
      days: 'Mon-Fri',
      km: 6.4,
      trips: 36,
    },
    {
      name: '36',
      stops: ['Waldweg', 'Friedhof', 'Kirchplatz', 'Markt'],
      minutes: 4,
      tours: 2,
      firstDeparture: 6 * 3600 + 5 * 60,
      headway: 60,
      days: 'Daily',
      km: 4.1,
      trips: 30,
    },
    {
      name: 'N7',
      stops: ['Bahnhof', 'Marktplatz', 'Gewerbegebiet', 'Siedlung'],
      minutes: 4,
      tours: 1,
      firstDeparture: 23 * 3600 + 40 * 60,
      headway: 60,
      days: 'Fri-Sat',
      km: 5.2,
    },
    {
      name: 'E24',
      stops: ['Schulzentrum', 'Marktplatz', 'Hauptbahnhof'],
      minutes: 4,
      tours: 2,
      firstDeparture: 7 * 3600 + 10 * 60,
      headway: 15,
      days: 'Mon-Fri',
      km: 3.2,
      trips: 8,
      aiOnly: true,
    },
  ],
  'Berlin-Spandau': [
    {
      name: '92',
      stops: [
        'Rathaus Spandau',
        'Altstadt Spandau',
        'Falkenseer Platz',
        'Neuendorfer Allee',
        'Johannesstift',
        'Hakenfelde',
      ],
      minutes: 4,
      tours: 6,
      firstDeparture: 4 * 3600 + 48 * 60,
      headway: 10,
      days: 'Mon-Fri',
      km: 9.8,
      trips: 28,
    },
    {
      name: '137',
      stops: ['Rathaus Spandau', 'Seegefelder Straße', 'Wröhmännerpark', 'Am Omnibushof'],
      minutes: 5,
      tours: 3,
      firstDeparture: 5 * 3600 + 20 * 60,
      headway: 20,
      days: 'Daily',
      km: 7.3,
      trips: 30,
    },
    {
      name: '13N',
      stops: ['Rathaus Spandau', 'Altstadt Spandau', 'Zitadelle', 'Haselhorst'],
      minutes: 4,
      tours: 2,
      firstDeparture: 0 * 3600 + 15 * 60,
      headway: 30,
      days: 'Daily',
      km: 6.0,
      trips: 8,
    },
  ],
  Neuhausen: [
    {
      name: '501',
      stops: ['ZOB', 'Bahnhofstraße', 'Klinikum', 'Industriegebiet Nord'],
      minutes: 5,
      tours: 2,
      firstDeparture: 6 * 3600,
      headway: 60,
      days: 'Mon-Fri',
      km: 8.6,
      trips: 14,
    },
  ],
};

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function runsOn(days: string, date: Date): boolean {
  const d = date.getDay();
  if (days === 'Daily') return true;
  if (days === 'Mon-Fri') return d >= 1 && d <= 5;
  if (days === 'Fri-Sat') return d === 5 || d === 6;
  return DAY[d] === days;
}

function nextRun(days: string, date: Date): string | null {
  for (let i = 1; i <= 7; i++) {
    const next = new Date(date);
    next.setDate(date.getDate() + i);
    if (runsOn(days, next)) return next.toISOString().slice(0, 10);
  }
  return null;
}

function trip(def: LineDef, index: number, departure: number, reverse: boolean): TripInfo {
  const stops = reverse ? [...def.stops].reverse() : def.stops;
  const times: StopInfo[] = stops.map((name, i) => {
    const t = departure + i * def.minutes * 60;
    return { name, arr: i === 0 ? -1 : t, dep: i === stops.length - 1 ? -1 : t + 20 };
  });
  return {
    name: `${def.name}_${reverse ? 'B' : 'A'}`,
    index,
    line: def.name,
    from: stops[0],
    terminus: stops[stops.length - 1],
    departure,
    arrival: departure + (stops.length - 1) * def.minutes * 60,
    stops: times,
    km: def.km,
  };
}

export function lines(map: string, date: string): LineInfo[] {
  const day = new Date(`${date}T12:00:00`);
  const name = MAPS.find((m) => m.file === map)?.name ?? map;
  return (LINE_DEFS[name] ?? []).map((def) => {
    const run = (def.stops.length - 1) * def.minutes * 60;
    const tours: TourInfo[] = Array.from({ length: def.tours }, (_, t) => {
      const start = def.firstDeparture + t * def.headway * 60;
      const trips = Array.from({ length: def.trips ?? 6 }, (_, i) =>
        trip(def, i, start + i * (run + 6 * 60), i % 2 === 1),
      );
      const runs = runsOn(def.days, day);
      return {
        number: String(t + 1),
        ai_group: `${def.name}-${t + 1}`,
        first: trips[0].departure,
        last: trips[trips.length - 1].arrival,
        days: def.days,
        runs,
        next_run: runs ? null : nextRun(def.days, day),
        trips,
      };
    });
    return {
      name: def.name,
      user_allowed: !def.aiOnly,
      termini: [def.stops[0], def.stops[def.stops.length - 1]],
      tours,
    };
  });
}

export function minimap(mapFile: string): Minimap {
  const map = MAPS.find((m) => m.file === mapFile);
  const defs = LINE_DEFS[map?.name ?? ''] ?? [];
  const roads: Minimap['roads'] = [];
  for (let i = -3; i <= 3; i++) {
    roads.push({
      main: i === 0,
      width: 6,
      points: [
        [-900, i * 260],
        [900, i * 260 + 40],
      ],
    });
    roads.push({
      main: false,
      width: 5,
      points: [
        [i * 280, -900],
        [i * 280 + 30, 900],
      ],
    });
  }
  const stops: Minimap['stops'] = [];
  defs.forEach((def, l) => {
    def.stops.forEach((name, k) => {
      if (stops.some((s) => s.name === name)) return;
      const x = -780 + k * 280 + l * 30;
      const y = (l - 1) * 260 + k * 7;
      stops.push({ id: stops.length + 1, name, x, y, spawn: `${x - 14},${y},90,0` });
    });
  });
  const entries = (map?.entry_points ?? []).map((e, k) => ({
    index: e.index,
    name: e.name,
    x: -860 + k * 140,
    y: -700,
    spawn: `${-860 + k * 140},-700,0,0`,
  }));
  return { map: mapFile, roads, stops, entries };
}

export function ibis(line: string, hof: string): IbisInfo {
  const def = Object.values(LINE_DEFS)
    .flat()
    .find((d) => d.name === line);
  if (!def) return { hof, line_code: '', routes: [] };
  const code = line.replace(/\D/g, '').padStart(3, '0');
  return {
    hof,
    line_code: code,
    routes: [
      {
        code: '01',
        route: `${code}01`,
        name: `${def.stops[0]} → ${def.stops[def.stops.length - 1]}`,
        terminus_code: 11,
        terminus: def.stops[def.stops.length - 1],
      },
      {
        code: '02',
        route: `${code}02`,
        name: `${def.stops[def.stops.length - 1]} → ${def.stops[0]}`,
        terminus_code: 12,
        terminus: def.stops[0],
      },
    ],
  };
}

const HOUR = 3600;
const now = () => Math.floor(Date.now() / 1000);

function run(
  ago: number,
  map: string,
  bus: string,
  line: string | null,
  km: number,
  minutes: number,
  extra: Partial<Session> = {},
): Session {
  return {
    time: now() - ago,
    driver: CONFIG.profile,
    map,
    bus,
    line,
    tour: line ? '2' : null,
    seconds: minutes * 60,
    metres: km * 1000,
    stops: Math.round(km * 3),
    early: 1,
    late: 2,
    tickets: Math.round(km * 4),
    cash: km * 6.2,
    crashes: 0,
    hurt: 0,
    jolts: 3,
    driving: 86,
    comfort: 79,
    ticketing: 93,
    ...extra,
  };
}

export const PROFILES = ['Jakob Weber', 'Testfahrer'];

const SPANDAU = 'Berlin-Spandau 1989';
const SD200 = 'Vehicles/MAN/MAN SD200 (SD80).bus';
const SD202 = 'Vehicles/MAN/MAN SD202 (D92).bus';
const NL202 = 'Vehicles/MAN/MAN NL202.bus';
const SL200 = 'Vehicles/MAN/MAN SL200.bus';

const RUNS: Record<string, () => Session[]> = {
  'Jakob Weber': () => [
    run(2 * HOUR, SPANDAU, SD200, '92', 31.4, 96, { early: 0, late: 4, tour: '3' }),
    run(26 * HOUR, 'Grundorf', NL202, '24', 12.8, 44, { crashes: 1, driving: 71, jolts: 9 }),
    run(50 * HOUR, 'Grundorf', SL200, null, 6.1, 22, {
      stops: 0,
      early: 0,
      late: 0,
      tickets: 0,
      cash: 0,
    }),
    run(73 * HOUR, SPANDAU, SD202, '137', 22.0, 71, { early: 3, late: 0, comfort: 88 }),
    run(97 * HOUR, SPANDAU, SD200, '92', 28.7, 88, { late: 6, ticketing: 81 }),
    run(121 * HOUR, 'Neuhausen', 'Vehicles/O530/O530.bus', '501', 18.2, 58, {
      hurt: 1,
      crashes: 1,
      driving: 54,
    }),
    run(170 * HOUR, 'Grundorf', NL202, '36', 9.4, 33, { early: 0, late: 0 }),
    run(195 * HOUR, SPANDAU, SD202, '13N', 24.9, 77, { tour: '1', comfort: 92, driving: 91 }),
    run(242 * HOUR, 'Grundorf', SL200, '24', 13.1, 47),
    run(290 * HOUR, SPANDAU, SD200, '137', 21.6, 69, { late: 5, jolts: 6 }),
    run(338 * HOUR, 'Neuhausen', 'Vehicles/N4016/N4016.bus', null, 4.3, 15, {
      stops: 0,
      early: 0,
      late: 0,
      tickets: 0,
      cash: 0,
    }),
    run(410 * HOUR, 'Grundorf', NL202, 'N7', 11.0, 39, { early: 2 }),
  ],
  Testfahrer: () => [
    run(30 * HOUR, 'Grundorf', NL202, '24', 7.9, 31, {
      driver: 'Testfahrer',
      late: 3,
      driving: 62,
      crashes: 2,
    }),
    run(220 * HOUR, 'Grundorf', SL200, null, 3.2, 12, {
      driver: 'Testfahrer',
      stops: 0,
      early: 0,
      late: 0,
      tickets: 0,
      cash: 0,
    }),
  ],
};

export function profile(name: string): Profile {
  if (name !== CONFIG.profile) {
    const sessions = RUNS[name]?.() ?? [];
    const sum = (f: (s: Session) => number) => sessions.reduce((n, s) => n + f(s), 0);
    return {
      name,
      file: `Drivers\\${name}.odr`,
      hours: sum((s) => s.seconds) / 3600,
      km: sum((s) => s.metres) / 1000,
      xp: sessions.length ? 140 : 0,
      level: 1,
      next_level_xp: 250,
      stops: sum((s) => s.stops),
      early: sum((s) => s.early),
      late: sum((s) => s.late),
      tickets: sum((s) => s.tickets),
      cash: sum((s) => s.cash),
      crashes: sum((s) => s.crashes),
      hurt: sum((s) => s.hurt),
      rating_driving: sessions.length ? 62 : 100,
      rating_comfort: 100,
      rating_tickets: 100,
      sessions,
      exists: true,
    };
  }
  return {
    name,
    file: `Drivers\\${name}.odr`,
    hours: 41.6,
    km: 1284.3,
    xp: 5810,
    level: 5,
    next_level_xp: 6250,
    stops: 3912,
    early: 214,
    late: 388,
    tickets: 5120,
    cash: 8044.5,
    crashes: 7,
    hurt: 1,
    rating_driving: 84,
    rating_comfort: 77,
    rating_tickets: 91,
    sessions: RUNS[name](),
    exists: true,
  };
}

export const MODS: ModsStatus = {
  content_dir: 'C:\\Users\\jakob\\.neoomsi\\content',
  folders: [
    ['Vehicles', 7],
    ['maps', 3],
    ['Sceneryobjects', 1243],
    ['Splines', 318],
    ['Texture', 96],
    ['Fonts', 22],
    ['Plugins', 0],
    ['TicketPacks', 2],
    ['Drivers', 4],
    ['Weather', 0],
    ['Announcements', 11],
    ['Humans', 38],
    ['Money', 1],
    ['Scripts', 0],
    ['Trains', 0],
    ['Situations', 0],
    ['Inputs', 0],
    ['Sound', 54],
  ],
  inbox: 'C:\\Users\\jakob\\.neoomsi\\content\\Mods',
  inbox_items: ['Ruhrbania_Busse_v2.zip'],
  waiting: ['BVG_GN_Repaints'],
  archives: [['Neuhausen_v1.4.zip', 812_000_000]],
  free_bytes: 214_000_000_000,
  cleaned: [
    'removed 1.4 GB of partial files of an interrupted install (C:\\Users\\jakob\\.neoomsi\\content\\.install-staging\\18044-2)',
  ],
  jobs: [
    {
      id: 3,
      source: 'C:\\Users\\jakob\\Downloads\\MAN_Lion_City_G_2020.zip',
      name: 'MAN_Lion_City_G_2020',
      state: 'unpacking',
      mode: 'auto',
      files_done: 142,
      files_total: 530,
      bytes_done: 412_000_000,
      bytes_total: 1_380_000_000,
      free_bytes: 214_000_000_000,
      needed_bytes: 1_917_000_000,
      message: '530 files, 1.4 GB',
      report: [
        'MAN_Lion_City_G_2020/Vehicles/MAN_LCG_2020 -> Vehicles/MAN_LCG_2020/ (488 files, 1.3 GB) - a bus',
        'MAN_Lion_City_G_2020/Fonts -> Fonts/ (42 files, 18 MB)',
        'left out: 3 read-mes and screenshots',
      ],
      warnings: [],
      installed: [],
      kept_aside: [],
      from_inbox: false,
      started: now() - 20,
      finished: null,
    },
    {
      id: 2,
      source: 'C:\\Users\\jakob\\Downloads\\Haltestellenschilder_Pack.rar',
      name: 'Haltestellenschilder_Pack',
      state: 'failed',
      mode: 'extract',
      files_done: 0,
      files_total: 0,
      bytes_done: 0,
      bytes_total: 0,
      free_bytes: 214_000_000_000,
      needed_bytes: 0,
      message:
        'could not tell what C:\\Users\\jakob\\Downloads\\Haltestellenschilder_Pack.rar is: no Vehicles / maps / Sceneryobjects ... folders and no .bus / .sco / .sli / global.cfg files in it',
      report: [
        'failed: could not tell what C:\\Users\\jakob\\Downloads\\Haltestellenschilder_Pack.rar is',
      ],
      warnings: [
        "2 file(s) whose names cannot be installed safely (a '..', '\\' or ':' in them) were left out",
        'Bilder/Vorschau.psd: not an OMSI file, left out',
      ],
      installed: [],
      kept_aside: [],
      from_inbox: false,
      started: now() - HOUR,
      finished: now() - HOUR + 4,
    },
    {
      id: 1,
      source: 'C:\\Users\\jakob\\Downloads\\O530_Repaints.zip',
      name: 'O530_Repaints',
      state: 'done',
      mode: 'extract',
      files_done: 184,
      files_total: 184,
      bytes_done: 96_000_000,
      bytes_total: 96_000_000,
      free_bytes: 214_000_000_000,
      needed_bytes: 96_000_000,
      message: 'installed Vehicles/MB_O530_Citaro_FL; kept aside: BVG_GN_Repaints',
      report: [
        'O530_Repaints/Citaro FL -> Vehicles/MB_O530_Citaro_FL/ (152 files, 81 MB) - paints',
        'O530_Repaints/BVG GN -> Mods/waiting/O530_Repaints/Vehicles/MAN_GN/ (32 files, 15 MB) - paints',
        'installed Vehicles/MB_O530_Citaro_FL; kept aside: BVG_GN_Repaints',
      ],
      warnings: [
        'MAN_GN: only paints or textures for a bus that is not installed (Vehicles/MAN_GN) - kept aside in Mods/waiting and installed by itself once that bus is installed',
      ],
      installed: ['Vehicles/MB_O530_Citaro_FL'],
      kept_aside: ['BVG_GN_Repaints'],
      from_inbox: false,
      started: now() - 3 * HOUR,
      finished: now() - 3 * HOUR + 40,
    },
  ],
  installed: [
    {
      name: 'MB_O530_Citaro_Facelift',
      installed: now() - 3 * HOUR,
      folders: ['Vehicles/MB_O530_Citaro_FL', 'Sound/O530_FL'],
      size: 1_120_000_000,
    },
    {
      name: 'Berlin-Spandau_1989',
      installed: now() - 12 * 24 * HOUR,
      folders: [
        'maps/Berlin-Spandau',
        'Sceneryobjects/Spandau',
        'Splines/Spandau',
        'Texture/Spandau',
      ],
      size: 6_840_000_000,
    },
    {
      name: 'Neuhausen_v1.4',
      installed: now() - 9 * 24 * HOUR,
      folders: ['Archives/Neuhausen_v1.4.zip'],
      size: 812_000_000,
    },
    {
      name: 'MAN_NL202',
      installed: now() - 30 * 24 * HOUR,
      folders: ['Vehicles/MAN_NL202'],
      size: 640_000_000,
    },
    {
      name: 'Volvo_7900_Electric',
      installed: now() - 5 * 24 * HOUR,
      folders: ['Vehicles/Volvo_7900E', 'Sound/Volvo_7900E'],
      size: 918_000_000,
    },
    {
      name: 'Grundorf_Haltestellen',
      installed: now() - 41 * 24 * HOUR,
      folders: ['Sceneryobjects/Grundorf_HST'],
      size: 48_000_000,
    },
    {
      name: 'Ansagen_Spandau',
      installed: now() - 12 * 24 * HOUR,
      folders: ['Announcements/Spandau'],
      size: 212_000_000,
    },
  ],
};

export const TUTORIALS: Tutorial[] = [
  {
    number: 1,
    title: 'Starting the bus',
    text: 'You are sitting in the cab of a MAN SD200 at the depot in Grundorf. This lesson shows you how to bring a cold bus to life.\n• Switch on the battery with the main switch to the left of the seat.\n• Turn the ignition key and wait until the warning lamps go out.\n• Start the engine and let the air pressure build up to 8 bar.\n• Release the parking brake and select D on the gear selector.\nWhen the bus rolls, the lesson is done.',
  },
  {
    number: 2,
    title: 'Driving and stopping',
    text: 'Now the bus moves. Drive a short loop around the market square and stop at the first stop.\n• Pull away gently: the passengers are standing.\n• Indicate before you leave the stop and before every turn.\n• Brake early and smoothly, stop with the front door at the sign.\n• Open the doors only once the bus stands still, and set the stop brake.\nAn abrupt stop costs comfort points in your rating.',
  },
  {
    number: 3,
    title: 'Tickets and the IBIS',
    text: 'Passengers want to know where you are going, and they want tickets.\n• Enter line and route into the IBIS: line 24, route 01.\n• Check that the destination sign shows "Rathaus".\n• Sell a single ticket and a day ticket with the printer, and give change.\n• Announce the next stop.\nThe IBIS codes of every line are in the roadbook on the Drive page.',
  },
  {
    number: 4,
    title: 'Special situations',
    text: 'Not every day goes to plan. In this last lesson you deal with what happens on the road.\n• A passenger in a wheelchair: kneel the bus and fold out the ramp.\n• A blocked lane: wait, or pass carefully with the hazard lights on.\n• Running late: keep to the speed limit, the timetable can wait.\nAfter this lesson you are ready for your first real duty.',
  },
];

export const SERVERS: ServerInfo[] = [
  {
    address: 'play.neoomsi.org',
    name: 'neoOMSI Official',
    official: true,
    motd: 'Be nice, drive to the timetable.',
    map: 'Berlin-Spandau 1989',
    time: '07:42',
    weather: 'Overcast',
    players: 18,
    max_players: 32,
    error: null,
  },
  {
    address: '85.214.20.17:7777',
    name: 'Spandau Stammtisch',
    official: false,
    motd: 'Every Thursday from 20:00',
    map: 'Berlin-Spandau 1989',
    time: '21:10',
    weather: 'Clear',
    players: 4,
    max_players: 12,
    error: null,
  },
  {
    address: 'https://grundorf-rush.trycloudflare.com',
    name: 'Grundorf Rush Hour',
    official: false,
    motd: 'Full timetable, 120 % traffic. No crashes into the market square please.',
    map: 'maps/Grundorf/global.cfg',
    time: '16:55',
    weather: '',
    players: 10,
    max_players: 10,
    error: null,
  },
  {
    address: 'hh-bus.de:7777',
    name: 'Hamburg Nachtbus',
    official: false,
    motd: 'Night lines only, from 23:00.',
    map: 'maps/Hamburg-Dammtor/global.cfg',
    time: '23:48',
    weather: 'Light rain',
    players: 2,
    max_players: 16,
    error: null,
  },
  {
    address: 'omsi.example.net',
    name: '',
    official: false,
    motd: '',
    map: '',
    time: '',
    weather: '',
    players: 0,
    max_players: 0,
    error: 'connection refused',
  },
];

export const CONTROLLERS: Controller[] = [
  {
    name: 'Logitech G923 Racing Wheel',
    connected: true,
    enabled: true,
    deadzone: 0.02,
    force_feedback: true,
    axes: [
      { name: 'X axis', value: 0.18, function: 'steering', reversed: false, shape: 'linear' },
      { name: 'Y axis', value: 1, function: '', reversed: false, shape: 'linear' },
      { name: 'Z axis', value: 1, function: '', reversed: false, shape: 'linear' },
      { name: 'Z rotation', value: 1, function: '', reversed: false, shape: 'linear' },
    ],
    buttons: [
      ['Button 1', 'bus_doorfront0'],
      ['Button 2', 'bus_doorfront1'],
      ['Button 3', 'bus_dooraft'],
      ['Button 4', 'kw_fernlicht_toggle'],
      ['Button 5', 'blinker_right_set'],
      ['Button 6', 'blinker_left_set'],
      ['Button 7', 'horn'],
      ['Button 8', 'parking_brake_toggle'],
      ['Button 9', 'view_interiorcam_plus'],
      ['Button 10', 'view_interiorcam_minus'],
      ['Button 11', ''],
      ['Button 12', ''],
      ['Hat 1 up', 'automatic_D'],
      ['Hat 1 right', 'automatic_N'],
      ['Hat 1 down', 'automatic_R'],
      ['Hat 1 left', 'blinker_off'],
    ],
  },
  {
    name: 'Fanatec ClubSport Pedals V3',
    connected: true,
    enabled: true,
    deadzone: 0.04,
    force_feedback: false,
    axes: [
      { name: 'X axis', value: 0.62, function: 'throttle', reversed: true, shape: 'linear' },
      { name: 'Y axis', value: 1, function: 'brake', reversed: true, shape: 'progressive' },
      { name: 'Z axis', value: 1, function: 'clutch', reversed: true, shape: 'degressive' },
    ],
    buttons: [],
  },
  {
    name: 'Xbox Wireless Controller',
    connected: true,
    enabled: false,
    deadzone: 0.12,
    force_feedback: true,
    axes: [
      {
        name: 'Left stick X',
        value: -0.04,
        function: 'steering',
        reversed: false,
        shape: 'bi-progressive',
      },
      { name: 'Left stick Y', value: 0.02, function: '', reversed: false, shape: 'linear' },
      { name: 'Left trigger', value: -1, function: 'brake', reversed: false, shape: 'linear' },
      {
        name: 'Right stick X',
        value: 0,
        function: 'look_x',
        reversed: false,
        shape: 'bi-degressive',
      },
      { name: 'Right stick Y', value: 0, function: 'look_y', reversed: true, shape: 'linear' },
      { name: 'Right trigger', value: -1, function: 'throttle', reversed: false, shape: 'linear' },
    ],
    buttons: [
      ['A', 'bus_doorfront0'],
      ['B', 'bus_dooraft'],
      ['X', 'kw_m_enginestart'],
      ['Y', 'view_toggle_viewpoint'],
      ['LB', 'blinker_left_set'],
      ['RB', 'blinker_right_set'],
      ['View', 'parking_brake_toggle'],
      ['Menu', 'sim_pause'],
    ],
  },
  {
    name: 'Thrustmaster TH8A Shifter',
    connected: false,
    enabled: true,
    deadzone: 0,
    force_feedback: false,
    axes: [],
    buttons: [
      ['Button 1', 'kw_s_1_fest'],
      ['Button 2', 'kw_s_2_fest'],
      ['Button 3', 'kw_s_3_fest'],
      ['Button 4', 'kw_s_4_fest'],
      ['Button 5', 'kw_s_5_fest'],
      ['Button 6', 'kw_s_6_fest'],
      ['Button 7', 'kw_s_R_fest'],
    ],
  },
];

const bind = (action: string, scan_code: number, modifier = 0) => ({ action, scan_code, modifier });

export const KEYBINDINGS: KeyBindings = {
  vehicles: [
    bind('throttle', 17, 1),
    bind('throttle', 200, 1),
    bind('brake', 31, 1),
    bind('brake', 208, 1),
    bind('throttle_amplify', 78, 1),
    bind('clutch', 15, 1),
    bind('steering_left', 30, 1),
    bind('steering_neutral', 76, 1),
    bind('steering_right', 32, 1),
    bind('ticket_give', 20),
    bind('change_give', 20, 4),
    bind('change_take', 20, 2),
    bind('parking_brake_toggle', 52),
    bind('blinker_left_set', 16, 1),
    bind('blinker_right_set', 18, 1),
    bind('blinker_off', 19),
    bind('blinker_warn_toggle', 48),
    bind('kw_scheinwerfer_toggle', 38),
    bind('kw_standlicht_toggle', 38, 2),
    bind('kw_fernlicht_toggle', 33),
    bind('kw_m_enginestart', 50),
    bind('kw_wipermode_up', 22),
    bind('horn', 35, 1),
    bind('cp_microphone', 47, 1),
    bind('cp_fahrerlicht_toggle', 7),
    bind('cp_licht_untenrechts_toggle', 8),
    bind('cp_licht_oberdeck_toggle', 9),
    bind('cp_licht_unterdeck_toggle', 10),
    bind('kw_s_R', 19),
    bind('kw_s_N', 49),
    bind('kw_s_1', 0),
    bind('kw_s_2', 0),
    bind('kw_s_plus', 26),
    bind('kw_s_minus', 53),
    bind('automatic_R', 19),
    bind('automatic_N', 49),
    bind('automatic_D', 0),
    bind('bus_doorfront0', 2),
    bind('bus_doorfront1', 3),
    bind('bus_dooraft', 4),
    bind('bus_20h-switch', 70),
    bind('bus_rollband_setL1', 63),
    bind('bus_rollband_setT', 66),
    bind('bus_rollband_up', 201, 1),
    bind('bus_rollband_dn', 209, 1),
    bind('IBIS_eingabe', 156, 4),
    bind('IBIS_1', 79, 4),
    bind('IBIS_2', 80, 4),
    bind('IBIS_3', 81, 4),
    bind('IBIS_0', 82, 4),
    bind('IBIS_loeschen', 83, 4),
    bind('IBIS_setmode_linie_kurs', 55, 4),
    bind('IBIS_setmode_route', 181, 4),
    bind('IBIS_setmode_ziel', 74, 4),
    bind('cashdesk_changer_2_00', 7, 4),
    bind('cashdesk_changer_1_00', 8, 4),
    bind('cashdesk_changer_0_50', 9, 4),
    bind('cashdesk_changer_0_10', 10, 4),
    bind('cp_wischer_intervall_toggle', 17, 2),
    bind('cp_wischer_wascher_button', 17, 4),
    bind('cp_batterietrennschalter_toggle', 18, 2),
    bind('taster_nebelschluss', 33, 4),
    bind('cp_schalter_kinderwagen', 88),
    bind('cp_haltestellenbremse_kneeling', 37, 2),
  ],
  game: [
    bind('sim_pause', 25),
    bind('open_mainmenue', 1),
    bind('exit', 16, 4),
    bind('view_toggle_viewpoint', 26),
    bind('view_set_driver', 59),
    bind('view_set_passenger', 60),
    bind('view_set_outside', 61),
    bind('view_set_map', 62),
    bind('view_set_ego', 87),
    bind('view_set_schedule', 210, 1),
    bind('view_set_ticketselling', 199, 1),
    bind('view_reset_direction', 46),
    bind('view_reset_all_directions', 57),
    bind('view_interiorcam_minus', 203),
    bind('view_interiorcam_plus', 205),
    bind('view_toggle_informationdisplay', 21, 2),
    bind('screenshot', 25, 6),
    bind('quicksave', 31, 4),
    bind('toggel_ctrler', 37),
    bind('toggel_mouse_ctrl', 24),
    bind('chat_open', 20, 4),
    bind('chat_toggle', 46, 4),
    bind('vr_recenter', 57, 4),
    bind('vr_toggle_desktop_mirror', 50, 4),
    bind('vr_toggle_mode', 47, 12),
    bind('vr_toggle_navigator', 49, 4),
    bind('vr_position_navigator', 0),
    bind('scendes_grabmode', 34),
    bind('scendes_rotmode', 19),
    bind('scendes_set_x', 45),
    bind('scendes_set_y', 44),
    bind('scendes_set_z', 21),
    bind('scendes_new', 49),
    bind('scendes_delete', 211),
  ],
};

export function defaultSettings(): Settings {
  return {
    ...pageDefaults(),
    graphics: 'enhanced',
    enhanced: true,
    mouse_sens: 1.2,
    ai_unsched_factor: 75,
    vol_ai: 0.8,
    vol_scenery: 0.7,
    seat_y: 0.04,
    pax_density: 1.2,
    texture_memory_auto: 4000,
  };
}
