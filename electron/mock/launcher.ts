import type {
  Command,
  CommandResult,
  Config,
  Controller,
  Duty,
  Instance,
  InstallMode,
  InstallProgress,
  InstalledMod,
  KeyBindings,
  SourceInfo,
  ServerInfo,
  Settings,
} from '../../src/types/launcher';
import { mockBusModel } from './bus-model';
import {
  CONFIG,
  CONTROLLERS,
  KEYBINDINGS,
  MAPS,
  MODS,
  PROFILES,
  SERVERS,
  TUTORIALS,
  VEHICLES,
  WEATHER,
  defaultSettings,
  ibis,
  lines,
  minimap,
  profile,
} from './content';

const now = () => Math.floor(Date.now() / 1000);

function seedInstances(): Instance[] {
  const game = (pid: number, slot: number, patch: Partial<Instance>): Instance => ({
    id: `game-${pid}`,
    pid,
    process_started: now() - 2820,
    slot,
    log: `C:\\Users\\jakob\\.neoomsi\\game${slot ? `-${slot}` : ''}.log`,
    started: now() - 2820,
    map: 'Berlin-Spandau 1989',
    bus: 'Vehicles/MAN/MAN SD200 (SD80).bus',
    entry: 0,
    line: '92',
    tour: '3',
    profile: CONFIG.profile,
    lan: 'off',
    args: [],
    running: true,
    ended: null,
    exit_code: null,
    stopping: null,
    killed: false,
    lan_status: null,
    last_line: '',
    ...patch,
  });
  return [
    game(17840, 0, {
      lan: 'host',
      last_line: 'Line 92 → Rathaus Spandau, 1 min late, 23 passengers on board',
      lan_status: {
        role: 'host',
        code: 'OMSI-7KQ2-M4XD-9PRT',
        tunnel: true,
        players: [
          {
            name: CONFIG.profile,
            bus: 'Vehicles/MAN/MAN SD200 (SD80).bus',
            line: '92',
            destination: 'Rathaus Spandau',
            passengers: 23,
            location: 'Altstädter Ring',
          },
          {
            name: 'Lena K.',
            bus: 'Vehicles/MAN/MAN SD202 (D92).bus',
            line: '137',
            destination: 'Johannesstift',
            passengers: 11,
            location: 'Falkenseer Platz',
          },
          {
            name: 'busfahrer_ole',
            bus: 'Vehicles/MAN/MAN SL200.bus',
            line: '',
            destination: '',
            passengers: 0,
            location: 'Betriebshof Spandau',
          },
        ],
        chat: [
          'Lena K.: Bin in 5 Minuten am Rathaus',
          'busfahrer_ole: kurz Pause, Kaffee',
          `${CONFIG.profile}: Alles klar, ich warte an der Wendeschleife`,
        ],
        warnings: [
          'busfahrer_ole is missing the map "Berlin-Spandau 1989" v1.3 and sees an older version',
        ],
        connected: true,
        host_name: CONFIG.profile,
        rejected: '',
      },
    }),
    game(17112, 1, {
      started: now() - 5400,
      process_started: now() - 5400,
      map: 'Grundorf',
      bus: 'Vehicles/MAN/MAN NL202.bus',
      line: '24',
      tour: '2',
      running: false,
      ended: now() - 540,
      exit_code: -1073741819,
      last_line: 'ERROR access violation in Sceneryobjects/Ampel/ampel.sco script, line 212',
    }),
    game(16950, 2, {
      started: now() - 7800,
      process_started: now() - 7800,
      map: 'Neuhausen',
      bus: 'Vehicles/O530/O530.bus',
      line: null,
      tour: null,
      running: false,
      ended: now() - 1320,
      killed: true,
      stopping: now() - 1328,
      last_line: 'Saving the personnel file…',
    }),
  ];
}

export class MockLauncher {
  private settings: Settings = defaultSettings();
  private config: Config = { ...CONFIG };
  private profiles = [...PROFILES];
  private keys: KeyBindings = structuredClone(KEYBINDINGS);
  private controllers: Controller[] = structuredClone(CONTROLLERS);
  private servers: ServerInfo[] = [...SERVERS];
  private instances: Instance[] = seedInstances();
  private jobs: InstallProgress[] = structuredClone(MODS.jobs);
  private installedMods: InstalledMod[] = structuredClone(MODS.installed ?? []);
  private jobTicks = new Map<number, number>(
    MODS.jobs.filter((j) => j.finished === null).map((j) => [j.id, 4]),
  );
  private nextPid = 18200;

  handle<C extends Command>(command: C, args: unknown): CommandResult<C> {
    return this.dispatch(command, (args ?? {}) as Record<string, unknown>) as CommandResult<C>;
  }

  private dispatch(command: Command, args: Record<string, unknown>): unknown {
    switch (command) {
      case 'config':
        return this.config;
      case 'maps':
        return MAPS;
      case 'vehicles':
        return VEHICLES;
      case 'weather':
        return WEATHER;
      case 'lines':
        return lines(String(args.map), String(args.date));
      case 'ibis':
        return ibis(String(args.line), String(args.hof));
      case 'profiles':
        return this.profiles;
      case 'profile':
        return profile(String(args.name));
      case 'mods':
        this.advanceJobs();
        return { ...MODS, jobs: this.jobs, installed: this.installedMods };
      case 'install':
        return this.install(String(args.path), (args.mode as InstallMode) ?? 'auto');
      case 'instances':
        return this.instances;
      case 'stop':
        return this.stop(Number(args.pid));
      case 'log':
        return this.log(Number(args.pid), args.lines ? Number(args.lines) : undefined);
      case 'join':
        return this.join(String(args.text));
      case 'settings':
        return this.settings;
      case 'save_settings':
        this.settings = { ...this.settings, ...(args as Settings) };
        return this.settings;
      case 'keybindings':
        return this.keys;
      case 'save_keybindings':
        this.keys = structuredClone(args as unknown as KeyBindings);
        return this.keys;
      case 'launch':
        return this.launch(args as unknown as Duty);
      case 'minimap':
        return minimap(String(args.map));
      case 'preview':
        return mockBusModel(String(args.paint ?? ''));
      case 'tutorials':
        return TUTORIALS;
      case 'servers':
        return this.servers;
      case 'save_servers': {
        const list = (args.servers ?? []) as { name: string; address: string }[];
        this.servers = [
          ...this.servers.filter((s) => s.official),
          ...list.map(
            (s) =>
              this.servers.find((o) => o.address === s.address) ?? {
                ...s,
                official: false,
                motd: '',
                map: '',
                time: '',
                weather: '',
                players: 0,
                max_players: 0,
                error: 'Not reachable',
              },
          ),
        ];
        return {};
      }
      case 'version':
        return { version: '0.2.0-mock', protocol: 1 };
      case 'save_config':
        this.config = { ...this.config, ...(args as Partial<Config>) };
        return this.config;
      case 'create_profile': {
        const name = String(args.name).trim();
        if (!name) throw new Error('A driver needs a name');
        if (this.profiles.includes(name)) throw new Error(`${name} already exists`);
        this.profiles.push(name);
        this.config = { ...this.config, profile: name };
        return { ...profile(name), name, exists: true };
      }
      case 'delete_profile':
        this.profiles = this.profiles.filter((p) => p !== args.name);
        if (this.config.profile === args.name) {
          this.config = { ...this.config, profile: this.profiles[0] ?? '' };
        }
        return { deleted: true };
      case 'modinfo':
        return modInfo(String(args.path));
      case 'start_install':
        return this.install(String(args.path), (args.mode as InstallMode) ?? 'auto');
      case 'cancel_install': {
        const job = this.jobs.find((j) => j.id === Number(args.id));
        if (!job || job.finished) return { cancelled: false };
        job.state = 'cancelled';
        job.message = 'cancelled - nothing was installed, the unpacked files were removed';
        job.finished = now();
        return { cancelled: true };
      }
      case 'clear_installs':
        this.jobs = this.jobs.filter((j) => j.finished === null);
        return {};
      case 'uninstall_mod': {
        const mod = this.installedMods.find((m) => m.name === args.name);
        if (!mod) throw new Error(`${String(args.name)} is not installed`);
        this.installedMods = this.installedMods.filter((m) => m !== mod);
        return { uninstalled: mod.folders };
      }
      case 'option_presets':
        return [];
      case 'open_game_launcher':
        throw new Error('The mock engine has no game window.');
      case 'controllers':
        return this.controllers;
      case 'save_controllers':
        this.controllers = structuredClone((args.controllers ?? []) as Controller[]);
        return this.controllers;
      case 'situations':
        return args.map === 'maps/Berlin-Spandau/global.cfg'
          ? [{ name: 'Line 92, tour 2', file: 'laststn.osn', time: now() - 7200 }]
          : [];
    }
  }

  private launch(duty: Duty) {
    if (!duty.tutorial && (!duty.map || !duty.bus)) {
      throw new Error('Choose a bus and a map first.');
    }
    const pid = this.nextPid++;
    const lan = duty.lan ?? 'off';
    this.instances.push({
      id: `game-${pid}`,
      pid,
      process_started: now(),
      slot: this.instances.length,
      log: `C:\\Users\\jakob\\.neoomsi\\game${this.instances.length ? `-${this.instances.length}` : ''}.log`,
      started: now(),
      map: MAPS.find((m) => m.file === duty.map)?.friendly ?? duty.map,
      bus: VEHICLES.find((v) => v.file === duty.bus)?.name ?? duty.bus,
      entry: duty.entry ?? null,
      line: duty.line ?? null,
      tour: duty.tour ?? null,
      profile: duty.profile ?? CONFIG.profile,
      lan,
      args: ['--map', duty.map, '--bus', duty.bus, '--time', duty.time],
      running: true,
      ended: null,
      exit_code: null,
      stopping: null,
      killed: false,
      lan_status:
        lan === 'host'
          ? {
              role: 'host',
              code: 'OMSI-7KQ2-M4XD-9PRT',
              tunnel: true,
              players: [
                {
                  name: CONFIG.profile,
                  bus: duty.bus,
                  line: duty.line ?? '',
                  destination: '',
                  passengers: 0,
                  location: 'Depot',
                },
              ],
              chat: [],
              warnings: [],
              connected: true,
              host_name: CONFIG.profile,
              rejected: '',
            }
          : null,
      last_line: 'Loading map tiles 12 / 94',
    });
    return {
      pid,
      log: this.instances[this.instances.length - 1].log,
      command: 'neoomsi.exe',
      others: this.instances.filter((i) => i.running).length - 1,
    };
  }

  private stop(pid: number) {
    const instance = this.instances.find((i) => i.pid === pid);
    if (!instance) throw new Error(`No game with process ${pid}`);
    instance.running = false;
    instance.ended = now();
    instance.exit_code = 0;
    instance.lan_status = null;
    instance.last_line = 'Session saved, goodbye.';
    return { stopped: true, ended_by_itself: true };
  }

  private log(pid: number, lines = 200) {
    const instance = this.instances.find((i) => i.pid === pid);
    if (!instance) return [];
    const until = instance.ended ?? now();
    const ticks = Math.min(400, Math.floor((until - instance.started) / 3));
    const events = [
      'INFO  stop "Rathaus Spandau": 14 in, 9 out',
      'INFO  ticket sold: single fare 2.70',
      'INFO  timetable: 1 min 20 s late at "Altstädter Ring"',
      'WARN  spline 1184 has no neighbour at its end, AI traffic turns back',
      'INFO  autosave written',
      'INFO  passenger complaint: harsh braking',
    ];
    return [
      `INFO  neoOMSI 0.2.0 starting, process ${pid}`,
      `INFO  map ${instance.map}`,
      `INFO  bus ${instance.bus}`,
      'INFO  graphics: Vulkan, NVIDIA GeForce RTX 3070',
      'WARN  texture "Sceneryobjects/Bushaltestelle/hst.dds" missing, using a placeholder',
      'INFO  timetable: 3 lines, 9 tours',
      ...Array.from({ length: ticks }, (_, k) => {
        const at = new Date((instance.started + k * 3) * 1000).toTimeString().slice(0, 8);
        return `${at} ${events[(k * 7 + pid) % events.length]}`;
      }),
      ...(instance.exit_code && instance.exit_code !== 0
        ? ['ERROR access violation in Sceneryobjects/Ampel/ampel.sco script, line 212']
        : []),
      instance.last_line,
    ].slice(-lines);
  }

  private join(text: string) {
    const value = text.trim();
    if (/^OMSI(-[A-Z0-9]{4}){2,}$/.test(value.toUpperCase())) {
      return {
        ok: true,
        text: 'The host drives on Berlin-Spandau 1989',
        map: 'maps/Berlin-Spandau/global.cfg',
      };
    }
    const address = value.match(
      /^(\d{1,3}(?:\.\d{1,3}){3}|[a-z0-9-]+(?:\.[a-z0-9-]+)+)(?::(\d+))?$/i,
    );
    if (address) {
      return { ok: true, text: `Joins ${address[1]} on port ${address[2] ?? '7777'}` };
    }
    return { ok: false, text: 'This is neither a session code nor an address' };
  }

  private install(path: string, mode: InstallMode): InstallProgress {
    const job: InstallProgress = {
      id: Math.max(0, ...this.jobs.map((j) => j.id)) + 1,
      source: path,
      name: (path.split(/[\\/]/).pop() ?? path).replace(/\.(zip|7z|rar)$/i, ''),
      state: 'queued',
      mode,
      files_done: 0,
      files_total: 0,
      bytes_done: 0,
      bytes_total: 0,
      free_bytes: MODS.free_bytes,
      needed_bytes: 0,
      message: 'waiting for the install before it',
      report: [],
      warnings: [],
      installed: [],
      kept_aside: [],
      from_inbox: false,
      started: now(),
      finished: null,
    };
    this.jobs.unshift(job);
    this.jobTicks.set(job.id, 0);
    return job;
  }

  private advanceJobs() {
    for (const job of this.jobs) {
      if (job.finished !== null) continue;
      const tick = (this.jobTicks.get(job.id) ?? 0) + 1;
      this.jobTicks.set(job.id, tick);
      this.stepJob(job, tick);
    }
  }

  private stepJob(job: InstallProgress, tick: number) {
    const unpackSteps = 6;
    const bytes = job.bytes_total || mockSize(job.name);
    const files = job.files_total || Math.max(12, Math.round(bytes / 2_600_000));
    const inPlace = job.mode === 'inplace';
    const archive = /\.(zip|7z|rar)$/i.test(job.source);
    const dest = inPlace ? `Archives/${job.source.split(/[\\/]/).pop()}` : mockDest(job.name);
    if (tick === 1) {
      job.state = 'planning';
      job.message = archive ? "reading the archive's table of contents" : 'listing the folder';
      job.report = [`${job.name} -> ${dest}/ (${files} files, ${mockGb(bytes)})`];
    } else if (tick === 2) {
      job.state = 'checking';
      job.message = 'checking the free disk space';
      job.files_total = files;
      job.bytes_total = bytes;
      job.needed_bytes = bytes + 512 * 1024 * 1024;
    } else if (tick < 3 + unpackSteps) {
      const done = (tick - 2) / unpackSteps;
      job.state = archive && !inPlace ? 'unpacking' : 'copying';
      job.message = inPlace
        ? `copying the archive (${mockGb(bytes)})`
        : `${files} files, ${mockGb(bytes)}`;
      job.files_total = files;
      job.bytes_total = bytes;
      job.files_done = Math.round(files * done);
      job.bytes_done = Math.round(bytes * done);
    } else if (tick === 3 + unpackSteps) {
      job.state = 'moving';
      job.message = inPlace
        ? 'putting the archive into place'
        : 'moving the files into the content folder';
      job.files_done = files;
      job.bytes_done = bytes;
    } else {
      job.state = 'done';
      job.message = `installed ${dest} - it is in the lists now`;
      job.report = [...job.report, job.message];
      job.installed = [dest];
      job.finished = now();
      this.installedMods = [
        { name: job.name, installed: now(), folders: [dest], size: bytes },
        ...this.installedMods.filter((m) => m.name !== job.name),
      ];
    }
  }
}

function mockSize(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return 60_000_000 + (hash % 2_100) * 1_000_000;
}

const mockGb = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(1)} GB` : `${Math.round(n / 1e6)} MB`;

function mockDest(name: string) {
  if (/map|spandau|grundorf|ruhr|neuhausen|stadt/i.test(name)) return `maps/${name}`;
  if (/haltestell|scenery|objekt|schild/i.test(name)) return `Sceneryobjects/${name}`;
  return `Vehicles/${name}`;
}

function modInfo(path: string): SourceInfo {
  const ext = path.match(/\.(zip|7z|rar)$/i)?.[1].toLowerCase();
  if (!ext) {
    return {
      is_archive: false,
      is_zip: false,
      files: 0,
      unpacked_bytes: 0,
      archive_bytes: 0,
      needed_bytes: 0,
      free_bytes: MODS.free_bytes,
      fits: true,
      in_place: 'only a .zip archive can be used in place',
      in_place_ok: false,
      suggested: 'extract',
    };
  }
  const name = (path.split(/[\\/]/).pop() ?? path).replace(/\.(zip|7z|rar)$/i, '');
  const unpacked = /komplett|complete|xxl/i.test(name) ? 260_000_000_000 : mockSize(name);
  const needed = unpacked + 512 * 1024 * 1024;
  const fits = needed <= MODS.free_bytes;
  const zip = ext === 'zip';
  return {
    is_archive: true,
    is_zip: zip,
    files: Math.max(12, Math.round(unpacked / 2_600_000)),
    unpacked_bytes: unpacked,
    archive_bytes: Math.round(unpacked * 0.58),
    needed_bytes: needed,
    free_bytes: MODS.free_bytes,
    fits,
    in_place: zip ? '' : '7z and RAR archives must be unpacked',
    in_place_ok: zip,
    suggested: !fits && zip ? 'inplace' : 'extract',
  };
}
