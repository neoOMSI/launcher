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
import { DEFAULT_SETTINGS_FIXTURE } from '../../src/fixtures/settings';

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
      const trips = Array.from({ length: 6 }, (_, i) =>
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
      user_allowed: true,
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
    driving: 0.86,
    comfort: 0.79,
    ticketing: 0.93,
    ...extra,
  };
}

export const PROFILES = ['Jakob Weber', 'Testfahrer'];

export function profile(name: string): Profile {
  if (name !== CONFIG.profile) {
    return {
      name,
      file: `Drivers\\${name}.odr`,
      hours: 0,
      km: 0,
      xp: 0,
      level: 1,
      next_level_xp: 250,
      stops: 0,
      early: 0,
      late: 0,
      tickets: 0,
      cash: 0,
      crashes: 0,
      hurt: 0,
      rating_driving: 0,
      rating_comfort: 0,
      rating_tickets: 0,
      sessions: [],
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
    rating_driving: 0.84,
    rating_comfort: 0.77,
    rating_tickets: 0.91,
    sessions: [
      run(2 * HOUR, 'Berlin-Spandau 1989', 'MAN SD200 (SD80)', '92', 31.4, 96),
      run(26 * HOUR, 'Grundorf', 'MAN NL202', '24', 12.8, 44, { crashes: 1 }),
      run(50 * HOUR, 'Grundorf', 'MAN SL200', null, 6.1, 22),
      run(97 * HOUR, 'Berlin-Spandau 1989', 'MAN SD202 (D92)', '137', 22.0, 71),
    ],
    exists: true,
  };
}

export const MODS: ModsStatus = {
  content_dir: 'C:\\Users\\jakob\\.neoomsi\\content',
  folders: [
    ['maps', 3],
    ['Vehicles', 7],
    ['Sceneryobjects', 1243],
    ['Splines', 318],
    ['Fonts', 22],
  ],
  inbox: 'C:\\Users\\jakob\\.neoomsi\\Mods',
  inbox_items: [],
  waiting: [],
  archives: [['Neuhausen_v1.4.7z', 812_000_000]],
  free_bytes: 214_000_000_000,
  cleaned: [],
  jobs: [
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
      message: 'Installed: 1 bus, 2 liveries',
      report: [],
      warnings: ['Needs "Citaro sound pack 2.1", which is not installed.'],
      installed: ['O530'],
      kept_aside: [],
      from_inbox: false,
      started: now() - 3 * HOUR,
      finished: now() - 3 * HOUR + 40,
    },
  ],
};

export const TUTORIALS: Tutorial[] = [
  {
    number: 1,
    title: 'Starting the bus',
    text: 'Get into the cab, switch on the battery and the engine, and release the parking brake.',
  },
  {
    number: 2,
    title: 'Driving and stopping',
    text: 'Pull away gently, brake smoothly in front of a stop and open the doors.',
  },
  {
    number: 3,
    title: 'Tickets and the IBIS',
    text: 'Set the route in the IBIS and sell tickets with the ticket printer.',
  },
  {
    number: 4,
    title: 'Your first duty',
    text: 'Drive a whole trip on Grundorf line 24 to the timetable.',
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
    name: 'Logitech G29 Driving Force Racing Wheel',
    connected: true,
    enabled: true,
    deadzone: 0.05,
    force_feedback: true,
    axes: [
      { name: 'X axis', value: 0.52, function: 'Steering', reversed: false, shape: 'linear' },
      { name: 'Y axis', value: 0.0, function: 'Throttle', reversed: true, shape: 'progressive' },
      { name: 'Z rotation', value: 0.0, function: 'Brake', reversed: true, shape: 'progressive' },
      { name: 'Slider 1', value: 0.0, function: 'Clutch', reversed: true, shape: 'linear' },
    ],
    buttons: [
      ['Button 1', 'Door 1'],
      ['Button 2', 'Door 2'],
      ['Button 5', 'Indicator left'],
      ['Button 6', 'Indicator right'],
      ['Hat up', 'Gear up'],
    ],
  },
  {
    name: 'Xbox Wireless Controller',
    connected: true,
    enabled: false,
    deadzone: 0.1,
    force_feedback: true,
    axes: [],
    buttons: [],
  },
];

const bind = (action: string, scan_code: number, modifier = 0) => ({ action, scan_code, modifier });

export const KEYBINDINGS: KeyBindings = {
  vehicles: [
    bind('Throttle', 0x48),
    bind('Brake', 0x50),
    bind('Steer left', 0x4b),
    bind('Steer right', 0x4d),
    bind('Door 1', 0x21),
    bind('Door 2', 0x22),
    bind('Indicator left', 0x1a),
    bind('Indicator right', 0x1b),
    bind('Kneeling', 0x1d),
    bind('Parking brake', 0x30),
    bind('Engine start', 0x12, 1),
    bind('Ticket printer', 0x14),
  ],
  game: [
    bind('VR: Recentre view', 0x13, 2),
    bind('Pause', 0x19),
    bind('Driver view', 0x3b),
    bind('Passenger view', 0x3c),
    bind('Outside view', 0x3d),
    bind('Map', 0x32),
    bind('Screenshot', 0x58),
    bind('Chat', 0x2f),
  ],
};

const FLAT: [string, keyof typeof DEFAULT_SETTINGS_FIXTURE, string][] = [
  ['msaa', 'graphics', 'msaa'],
  ['anisotropy', 'graphics', 'anisotropy'],
  ['ssao', 'graphics', 'ssao'],
  ['shadows', 'graphics', 'shadows'],
  ['shadow_size', 'graphics', 'shadow_size'],
  ['detail_textures', 'graphics', 'detail_textures'],
  ['fullscreen', 'graphics', 'fullscreen'],
  ['vsync', 'graphics', 'vsync'],
  ['texture_memory', 'graphics', 'texture_memory'],
  ['texture_compression', 'graphics', 'texture_compression'],
  ['clouds', 'graphics', 'clouds'],
  ['mirror_size', 'graphics', 'mirror_size'],
  ['mirror_refresh', 'graphics', 'mirror_refresh'],
  ['max_fps', 'graphics', 'max_fps'],
  ['min_obj_size', 'graphics', 'min_obj_size'],
  ['max_obj_dist', 'graphics', 'max_obj_dist'],
  ['view_distance', 'graphics', 'view_distance'],
  ['render_scale', 'graphics', 'render_scale'],
  ['shadow_casters', 'graphics', 'shadow_casters'],
  ['shadow_blobs', 'graphics', 'shadow_blobs'],
  ['reflections', 'graphics', 'reflections'],
  ['graphics_api', 'graphics', 'graphics_api'],
  ['graphics', 'graphics', 'graphics'],
  ['led_glow', 'graphics', 'led_glow'],
  ['nightmap_glow', 'graphics', 'nightmap_glow'],
  ['led_mips', 'graphics', 'led_mips'],
  ['atmosphere_brightness', 'graphics', 'atmosphere_brightness'],
  ['map_detail', 'graphics', 'map_detail'],
  ['navigator', 'ui', 'navigator'],
  ['ui_opacity', 'ui', 'opacity'],
  ['navigator_corner', 'ui', 'navigator_corner'],
  ['ui_scale', 'ui', 'scale'],
  ['ui_scale_window', 'ui', 'scale_window'],
  ['notes', 'ui', 'notes'],
  ['show_fps', 'ui', 'show_fps'],
  ['chat', 'ui', 'chat'],
  ['tooltips', 'ui', 'tooltips'],
  ['name_tags', 'ui', 'name_tags'],
  ['units', 'ui', 'units'],
  ['boarding', 'gameplay', 'boarding'],
  ['pax_prefer_seats', 'gameplay', 'pax_prefer_seats'],
  ['exact_fare', 'gameplay', 'exact_fare'],
  ['driver', 'gameplay', 'driver'],
  ['maintenance', 'gameplay', 'maintenance'],
  ['collision_vehicles', 'gameplay', 'collision_vehicles'],
  ['collision_objects', 'gameplay', 'collision_objects'],
  ['collision_pedestrians', 'gameplay', 'collision_pedestrians'],
  ['hands_in_cab', 'gameplay', 'hands_in_cab'],
  ['time_speed', 'gameplay', 'time_speed'],
  ['time_sync', 'gameplay', 'time_sync'],
  ['metar_sync', 'gameplay', 'metar_sync'],
  ['metar_station', 'gameplay', 'metar_station'],
  ['auto_clutch', 'gameplay', 'auto_clutch'],
  ['auto_ibis', 'gameplay', 'auto_ibis'],
  ['momentary_gears', 'gameplay', 'momentary_gears'],
  ['steering_linear', 'controls', 'steering_linear'],
  ['old_steering', 'controls', 'old_steering'],
  ['red_steer_spd', 'controls', 'red_steer_spd'],
  ['mouse_sens', 'controls', 'mouse_sens'],
  ['stick_sens', 'controls', 'stick_sens'],
  ['steer_center', 'controls', 'steer_center'],
  ['brake_hold', 'controls', 'brake_hold'],
  ['mouse_steering', 'controls', 'mouse_steering'],
  ['mouse_right_off', 'controls', 'mouse_right_off'],
  ['blinker_cancel', 'controls', 'blinker_cancel'],
  ['wheel_range', 'controls', 'wheel_range'],
  ['wheel_lock', 'controls', 'wheel_lock'],
  ['pedal_throttle', 'controls', 'pedal_throttle'],
  ['pedal_brake', 'controls', 'pedal_brake'],
  ['ai_max_scheduled', 'ai', 'max_scheduled'],
  ['ai_max_parked', 'ai', 'max_parked'],
  ['nav_arrows', 'navigator', 'arrows'],
  ['nav_ai', 'navigator', 'ai'],
  ['pax_voices', 'passengers', 'voices'],
  ['pax_models', 'passengers', 'models'],
  ['pax_motion', 'passengers', 'motion'],
  ['pax_ik', 'passengers', 'ik'],
  ['pax_density', 'passengers', 'density'],
  ['discord_status', 'discord', 'status'],
  ['volume', 'audio', 'master-volume'],
  ['vol_ai', 'audio', 'ai-volume'],
  ['vol_scenery', 'audio', 'scenery-volume'],
  ['doppler', 'audio', 'doppler'],
  ['ff_enabled', 'controller', 'ff_enabled'],
  ['ff_invert', 'controller', 'ff_invert'],
  ['ctrl_assign', 'controller', 'assign'],
  ['fov', 'camera', 'fov'],
  ['camera_collision', 'camera', 'collision'],
  ['driverview_smooth', 'camera', 'smooth'],
  ['head_movement', 'camera', 'head_movement'],
  ['steer_look', 'camera', 'steer_look'],
  ['steer_look_angle', 'camera', 'steer_look_angle'],
  ['steer_look_response', 'camera', 'steer_look_response'],
  ['seat_x', 'camera', 'seat_x'],
  ['seat_y', 'camera', 'seat_y'],
  ['seat_z', 'camera', 'seat_z'],
  ['look_sens', 'camera', 'look_sens'],
  ['alt_view', 'camera', 'alt_view'],
  ['head_tracking', 'camera', 'head_tracking'],
  ['vr', 'vr', 'enabled'],
  ['vr_scale', 'vr', 'scale'],
  ['vr_head_smoothing_ms', 'vr', 'head-smoothing-ms'],
  ['vr_mirror_rate', 'vr', 'mirror-rate'],
  ['vr_desktop_mirror', 'vr', 'desktop-mirror'],
  ['update_check', 'launcher', 'update_check'],
  ['update_auto', 'launcher', 'update_auto'],
];

export function defaultSettings(): Settings {
  const nested = DEFAULT_SETTINGS_FIXTURE as Record<
    string,
    Record<string, string | number | boolean>
  >;
  const flat: Settings = Object.fromEntries(FLAT.map(([key, cat, k]) => [key, nested[cat][k]]));
  flat.ai_unsched_factor = DEFAULT_SETTINGS_FIXTURE.ai.unsched_factor * 100;
  flat.language = DEFAULT_SETTINGS_FIXTURE.ui.language === 'DEU' ? 'de' : 'en';
  flat.texture_memory_auto = 4000;
  return flat;
}
