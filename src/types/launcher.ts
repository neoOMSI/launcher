// Shapes of neoOMSI's launcher commands (`neoomsi-launcher --cli <command>`), field names as serialized.

export interface Config {
  root: string;
  game: string;
  profile: string;
}

export interface EntryInfo {
  index: number;
  name: string;
}

export interface MapInfo {
  name: string;
  friendly: string;
  file: string;
  description: string;
  entry_points: EntryInfo[];
  hof: string;
  installed: boolean;
}

export interface VehicleInfo {
  name: string;
  manufacturer: string;
  type_name: string;
  file: string;
  folder: string;
  description: string;
  default_paint: string;
  paints: string[];
  hofs: string[];
  installed: boolean;
  missing_packs: string[];
  numbers: [string, string][];
}

export interface WeatherInfo {
  name: string;
  file: string;
  description: string;
  fog_m: number;
  temp: number;
  clouds: string;
  precip: string;
  snow: boolean;
  installed: boolean;
}

export interface StopInfo {
  name: string;
  arr: number;
  dep: number;
}

export interface TripInfo {
  name: string;
  index: number;
  line: string;
  from: string;
  terminus: string;
  departure: number;
  arrival: number;
  stops: StopInfo[];
  km: number;
}

export interface TourInfo {
  number: string;
  ai_group: string;
  first: number;
  last: number;
  days: string;
  runs: boolean;
  next_run: string | null;
  trips: TripInfo[];
}

export interface LineInfo {
  name: string;
  user_allowed: boolean;
  termini: string[];
  tours: TourInfo[];
}

export interface IbisRoute {
  code: string;
  route: string;
  name: string;
  terminus_code: number;
  terminus: string;
}

export interface IbisInfo {
  hof: string;
  line_code: string;
  routes: IbisRoute[];
}

export interface Session {
  time: number;
  driver: string;
  map: string;
  bus: string;
  line: string | null;
  tour: string | null;
  seconds: number;
  metres: number;
  stops: number;
  early: number;
  late: number;
  tickets: number;
  cash: number;
  crashes: number;
  hurt: number;
  jolts: number;
  driving: number;
  comfort: number;
  ticketing: number;
}

export interface Profile {
  name: string;
  file: string;
  hours: number;
  km: number;
  xp: number;
  level: number;
  next_level_xp: number;
  stops: number;
  early: number;
  late: number;
  tickets: number;
  cash: number;
  crashes: number;
  hurt: number;
  rating_driving: number;
  rating_comfort: number;
  rating_tickets: number;
  sessions: Session[];
  exists: boolean;
}

export type InstallMode = 'auto' | 'extract' | 'inplace';

export type InstallState =
  | 'queued'
  | 'planning'
  | 'checking'
  | 'unpacking'
  | 'copying'
  | 'moving'
  | 'done'
  | 'failed'
  | 'cancelled';

export interface InstallProgress {
  id: number;
  source: string;
  name: string;
  state: InstallState;
  mode: InstallMode;
  files_done: number;
  files_total: number;
  bytes_done: number;
  bytes_total: number;
  free_bytes: number;
  needed_bytes: number;
  message: string;
  report: string[];
  warnings: string[];
  installed: string[];
  kept_aside: string[];
  from_inbox: boolean;
  started: number;
  finished: number | null;
}

export interface ModsStatus {
  content_dir: string;
  folders: [string, number][];
  inbox: string;
  inbox_items: string[];
  waiting: string[];
  archives: [string, number][];
  free_bytes: number;
  cleaned: string[];
  jobs: InstallProgress[];
}

export interface LanPlayer {
  name: string;
  bus: string;
  line: string;
  destination: string;
  passengers: number;
  location: string;
}

export interface LanStatus {
  role: 'host' | 'join';
  code: string;
  tunnel: boolean;
  players: LanPlayer[];
  chat: string[];
  warnings: string[];
  connected: boolean;
  host_name: string;
  rejected: string;
}

export interface Instance {
  id: string;
  pid: number;
  process_started: number | null;
  slot: number;
  log: string;
  started: number;
  map: string;
  bus: string;
  entry: number | null;
  line: string | null;
  tour: string | null;
  profile: string;
  lan: string;
  args: string[];
  running: boolean;
  ended: number | null;
  exit_code: number | null;
  stopping: number | null;
  killed: boolean;
  lan_status: LanStatus | null;
  last_line: string;
}

export interface Duty {
  map: string;
  bus: string;
  paint?: string;
  plate?: string;
  number?: string;
  hof?: string;
  entry?: number;
  spawn?: string;
  line?: string;
  tour?: string;
  trip?: string;
  whole_tour?: boolean;
  time: string;
  date?: string;
  weather?: string;
  traffic?: number;
  passengers?: boolean;
  schedule?: boolean;
  autostart?: boolean;
  on_foot?: boolean;
  profile?: string;
  lan?: string;
  lan_name?: string;
  season?: string;
  tutorial?: number;
  situation?: string;
}

export interface MinimapRoad {
  main: boolean;
  width: number;
  points: [number, number][];
}

export interface MinimapPlace {
  name: string;
  x: number;
  y: number;
  spawn: string;
}

export interface Minimap {
  map: string;
  roads: MinimapRoad[];
  stops: (MinimapPlace & { id: number })[];
  entries: (MinimapPlace & { index: number })[];
  lanes?: [number, number][][];
  trips?: Record<string, number[]>;
}

export interface Launched {
  pid: number;
  log: string;
  command: string;
  others: number;
}

export interface KeyBinding {
  action: string;
  scan_code: number;
  modifier: number;
}

export interface KeyBindings {
  vehicles: KeyBinding[];
  game: KeyBinding[];
}

export type Settings = Record<string, string | number | boolean>;

// Launcher-side data the game window reads without a `--cli` command yet.

export interface Tutorial {
  number: number;
  title: string;
  text: string;
}

export interface ServerInfo {
  address: string;
  name: string;
  official: boolean;
  motd: string;
  map: string;
  time: string;
  weather: string;
  players: number;
  max_players: number;
  error: string | null;
}

export interface ControllerAxis {
  name: string;
  value: number;
  function: string;
  reversed: boolean;
  shape: 'linear' | 'progressive' | 'degressive' | 'bi-progressive' | 'bi-degressive';
}

export interface Controller {
  name: string;
  connected: boolean;
  enabled: boolean;
  deadzone: number;
  force_feedback: boolean;
  axes: ControllerAxis[];
  buttons: [string, string][];
}

export interface SavedSituation {
  name: string;
  file: string;
  time: number;
}

export interface Commands {
  config: { args: void; result: Config };
  maps: { args: void; result: MapInfo[] };
  vehicles: { args: void; result: VehicleInfo[] };
  weather: { args: void; result: WeatherInfo[] };
  lines: { args: { map: string; date: string }; result: LineInfo[] };
  ibis: { args: { bus: string; hof: string; line: string }; result: IbisInfo };
  profiles: { args: void; result: string[] };
  profile: { args: { name: string }; result: Profile };
  mods: { args: void; result: ModsStatus };
  install: { args: { path: string; mode?: InstallMode }; result: InstallProgress };
  instances: { args: void; result: Instance[] };
  stop: { args: { pid: number }; result: { stopped: boolean; ended_by_itself: boolean } };
  log: { args: { pid: number; lines?: number }; result: string[] };
  join: { args: { text: string }; result: { ok: boolean; text: string } };
  settings: { args: void; result: Settings };
  save_settings: { args: Settings; result: Settings };
  keybindings: { args: void; result: KeyBindings };
  launch: { args: Duty; result: Launched };
  preview: { args: { bus: string; paint: string }; result: string };
  minimap: { args: { map: string }; result: Minimap };
  tutorials: { args: void; result: Tutorial[] };
  servers: { args: void; result: ServerInfo[] };
  controllers: { args: void; result: Controller[] };
  situations: { args: { map: string }; result: SavedSituation[] };
}

export type Command = keyof Commands;
export type CommandArgs<C extends Command> = Commands[C]['args'];
export type CommandResult<C extends Command> = Commands[C]['result'];

export const COMMANDS: readonly Command[] = [
  'config',
  'maps',
  'vehicles',
  'weather',
  'lines',
  'ibis',
  'profiles',
  'profile',
  'mods',
  'install',
  'instances',
  'stop',
  'log',
  'join',
  'settings',
  'save_settings',
  'keybindings',
  'launch',
  'preview',
  'minimap',
  'tutorials',
  'servers',
  'controllers',
  'situations',
];
