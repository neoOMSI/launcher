import { create, type MessageInitShape } from '@bufbuild/protobuf';
import {
  CancelledSchema,
  ConfigSchema,
  ControllerListSchema,
  EmptySchema,
  EngineVersionSchema,
  GameUpdateSchema,
  InstallMode,
  InstallProgressSchema,
  InstallState,
  InstanceListSchema,
  InstanceSchema,
  JoinCheckSchema,
  KeyBindingsSchema,
  LanRole,
  LaunchedSchema,
  LineListSchema,
  LogLinesSchema,
  MapListSchema,
  OptionPresetListSchema,
  PaxPackSchema,
  PaxState,
  ProfileNamesSchema,
  ServerInfoSchema,
  ServerListSchema,
  SettingsSchema,
  SituationListSchema,
  SourceInfoSchema,
  StoppedSchema,
  TutorialListSchema,
  UpdateCheckSchema,
  UpdateState,
  VehicleListSchema,
  WeatherListSchema,
  settingsForEngine,
  settingsFromEngine,
  type Command,
  type CommandArgs,
  type CommandResult,
  type Config,
  type Controller,
  type InstallProgress,
  type InstalledMod,
  type Instance,
  type JoinCheck,
  type KeyBindings,
  type PaxPack,
  type ServerInfo,
  type Settings,
  type SourceInfo,
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
const secs = () => BigInt(now());

const PAX_RELEASE = {
  version: 2n,
  notes:
    '- 40 new people, from school children to commuters with suitcases\n- Faster loading of the passenger models',
  page: 'https://github.com/neoOMSI/neoOMSI/releases/tag/realistic-pax-v2',
  published: '2026-10-01T12:00:00Z',
};

const GAME_RELEASE = {
  version: '0.3.0',
  page: 'https://github.com/neoOMSI/neoOMSI/releases/tag/v0.3.0',
  prerelease: false,
  size: 140_000_000n,
  notes: [
    '> **Early development build.** Expect bugs.',
    '',
    "## What's changed",
    '',
    '### Features',
    '',
    '- The launcher shows what a new version brings ([#120](https://github.com/neoOMSI/neoOMSI/pull/120))',
    '- Start times can be typed to the minute',
    '',
    '### Fixes',
    '',
    '- Tutorials are listed again (`menu_1_ENG.html`)',
    '',
    '## Downloads',
    '',
    '| Platform | Game |',
    '| --- | --- |',
  ].join('\n'),
};

function seedInstances(): Instance[] {
  const game = (pid: number, slot: number, patch: MessageInitShape<typeof InstanceSchema>) =>
    create(InstanceSchema, {
      id: `game-${pid}`,
      pid,
      processStarted: BigInt(now() - 2820),
      slot,
      log: `C:\\Users\\jakob\\.neoomsi\\game${slot ? `-${slot}` : ''}.log`,
      started: BigInt(now() - 2820),
      map: 'Berlin-Spandau 1989',
      bus: 'Vehicles/MAN/MAN SD200 (SD80).bus',
      entry: 0,
      line: '92',
      tour: '3',
      profile: CONFIG.profile,
      lan: 'off',
      running: true,
      ...patch,
    });
  return [
    game(17840, 0, {
      lan: 'host',
      lastLine: 'Line 92 → Rathaus Spandau, 1 min late, 23 passengers on board',
      lanStatus: {
        role: LanRole.HOST,
        name: CONFIG.profile,
        code: 'OMSI-7KQ2-M4XD-9PRT',
        tunnel: 'https://omsi-7kq2.trycloudflare.com',
        players: [
          {
            id: 1,
            name: CONFIG.profile,
            bus: 'Vehicles/MAN/MAN SD200 (SD80).bus',
            line: '92',
            destination: 'Rathaus Spandau',
            passengers: 23,
            drawn: true,
          },
          {
            id: 2,
            name: 'Lena K.',
            bus: 'Vehicles/MAN/MAN SD202 (D92).bus',
            line: '137',
            destination: 'Johannesstift',
            passengers: 11,
            location: '1.2 km ahead',
            drawn: true,
          },
          {
            id: 3,
            name: 'busfahrer_ole',
            bus: 'Vehicles/MAN/MAN SL200.bus',
            passengers: 0,
            location: '3.4 km behind',
            drawn: false,
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
        hostName: CONFIG.profile,
        map: 'maps/Berlin-Spandau/global.cfg',
      },
    }),
    game(17112, 1, {
      started: BigInt(now() - 5400),
      processStarted: BigInt(now() - 5400),
      map: 'Grundorf',
      bus: 'Vehicles/MAN/MAN NL202.bus',
      line: '24',
      tour: '2',
      running: false,
      ended: BigInt(now() - 540),
      exitCode: -1073741819,
      lastLine: 'ERROR access violation in Sceneryobjects/Ampel/ampel.sco script, line 212',
    }),
    game(16950, 2, {
      started: BigInt(now() - 7800),
      processStarted: BigInt(now() - 7800),
      map: 'Neuhausen',
      bus: 'Vehicles/O530/O530.bus',
      line: undefined,
      tour: undefined,
      running: false,
      ended: BigInt(now() - 1320),
      killed: true,
      stopping: BigInt(now() - 1328),
      lastLine: 'Saving the personnel file…',
    }),
  ];
}

type Handlers = {
  [C in Command]: (args: CommandArgs<C>) => CommandResult<C> | Promise<CommandResult<C>>;
};

export class MockLauncher {
  private settings: Settings = defaultSettings();
  private config: Config = create(ConfigSchema, CONFIG);
  private profiles = [...PROFILES];
  private keys: KeyBindings = structuredClone(KEYBINDINGS);
  private controllers: Controller[] = structuredClone(CONTROLLERS);
  private servers: ServerInfo[] = [...SERVERS];
  private instances: Instance[] = seedInstances();
  private jobs: InstallProgress[] = structuredClone(MODS.jobs);
  private installedMods: InstalledMod[] = structuredClone(MODS.installed ?? []);
  private jobTicks = new Map<bigint, number>(
    MODS.jobs.filter((j) => j.finished === undefined).map((j) => [j.id, 4]),
  );
  private nextPid = 18200;
  private paxPack: PaxPack = create(PaxPackSchema, {
    state: PaxState.MISSING,
    latest: PAX_RELEASE,
  });

  handle<C extends Command>(
    command: C,
    args: unknown,
  ): CommandResult<C> | Promise<CommandResult<C>> {
    return this.handlers[command]((args ?? {}) as CommandArgs<C>);
  }

  private readonly handlers: Handlers = {
    config: () => this.config,
    saveConfig: (changes) => {
      this.config = create(ConfigSchema, {
        root: changes.root ?? this.config.root,
        game: changes.game ?? this.config.game,
        profile: changes.profile ?? this.config.profile,
      });
      return this.config;
    },
    maps: () => create(MapListSchema, { maps: MAPS }),
    vehicles: () => create(VehicleListSchema, { vehicles: VEHICLES }),
    weather: () => create(WeatherListSchema, { weather: WEATHER }),
    lines: ({ map, date }) => create(LineListSchema, { lines: lines(map ?? '', date ?? '') }),
    minimap: ({ map }) => minimap(map ?? ''),
    ibis: ({ line, hof }) => ibis(line ?? '', hof ?? ''),
    profiles: () => create(ProfileNamesSchema, { names: this.profiles }),
    profile: ({ name }) => profile(name ?? ''),
    createProfile: (args) => {
      const name = (args.name ?? '').trim();
      if (!name) throw new Error('A driver needs a name');
      if (this.profiles.includes(name)) throw new Error(`${name} already exists`);
      this.profiles.push(name);
      this.config = create(ConfigSchema, { ...this.config, profile: name });
      return { ...profile(name), name, exists: true };
    },
    deleteProfile: ({ name }) => {
      this.profiles = this.profiles.filter((p) => p !== name);
      if (this.config.profile === name) {
        this.config = create(ConfigSchema, { ...this.config, profile: this.profiles[0] ?? '' });
      }
      return create(EmptySchema);
    },
    mods: () => ({ ...MODS, jobs: this.jobs, installed: this.installedMods }),
    modinfo: ({ path }) => modInfo(path ?? ''),
    startInstall: ({ path, mode }) => this.install(path ?? '', mode ?? InstallMode.AUTO),
    cancelInstall: ({ id }) => {
      const job = this.jobs.find((j) => j.id === id);
      if (!job || job.finished !== undefined) return create(CancelledSchema);
      job.state = InstallState.CANCELLED;
      job.message = 'cancelled - nothing was installed, the unpacked files were removed';
      job.finished = secs();
      return create(CancelledSchema, { cancelled: true });
    },
    clearInstalls: () => {
      this.jobs = this.jobs.filter((j) => j.finished === undefined);
      return create(EmptySchema);
    },
    uninstallMod: ({ name }) => {
      const mod = this.installedMods.find((m) => m.name === name);
      if (!mod) throw new Error(`${name} is not installed`);
      this.installedMods = this.installedMods.filter((m) => m !== mod);
      return { uninstalled: mod.folders };
    },
    instances: () => create(InstanceListSchema, { instances: this.instances }),
    launch: (duty) => this.launch(duty),
    stop: ({ pid }) => this.stop(pid ?? 0),
    log: ({ pid, lines }) => create(LogLinesSchema, { lines: this.log(pid ?? 0, lines) }),
    join: ({ text }) => this.join(text ?? ''),
    settings: () => settingsForEngine(this.settings),
    saveSettings: (changes) => {
      this.settings = {
        ...this.settings,
        ...settingsFromEngine(create(SettingsSchema, changes)),
      };
      if (this.settings.pax_models === 'realistic' && this.paxPack.installed === undefined) {
        this.paxPack = create(PaxPackSchema, {
          ...this.paxPack,
          state: PaxState.OUTDATED,
          installed: 1n,
        });
      }
      return settingsForEngine(this.settings);
    },
    paxPack: () => this.paxPack,
    installPaxPack: () => {
      this.paxPack = create(PaxPackSchema, {
        ...this.paxPack,
        state: PaxState.INSTALLED,
        installed: PAX_RELEASE.version,
      });
      return this.paxPack;
    },
    updateCheck: () => create(UpdateCheckSchema, { release: GAME_RELEASE }),
    installUpdate: () =>
      create(GameUpdateSchema, {
        state: UpdateState.FAILED,
        message: 'The mock engine does not install updates.',
      }),
    optionPresets: () => create(OptionPresetListSchema),
    keybindings: () => this.keys,
    saveKeybindings: (keys) => {
      this.keys = create(KeyBindingsSchema, keys);
      return this.keys;
    },
    controllers: () => create(ControllerListSchema, { controllers: this.controllers }),
    saveControllers: ({ controllers }) => {
      this.controllers = create(ControllerListSchema, { controllers }).controllers;
      return create(ControllerListSchema, { controllers: this.controllers });
    },
    preview: ({ paint }) => mockBusModel(paint ?? ''),
    situations: ({ map }) =>
      create(SituationListSchema, {
        situations:
          map === 'maps/Berlin-Spandau/global.cfg'
            ? [{ name: 'Line 92, tour 2', file: 'laststn.osn', time: BigInt(now() - 7200) }]
            : [],
      }),
    tutorials: () => create(TutorialListSchema, { tutorials: TUTORIALS }),
    servers: () => create(ServerListSchema, { servers: this.servers }),
    saveServers: ({ servers }) => {
      this.servers = [
        ...this.servers.filter((s) => s.official),
        ...(servers ?? []).map(
          (s) =>
            this.servers.find((o) => o.address === s.address) ??
            create(ServerInfoSchema, {
              name: s.name,
              address: s.address,
              error: 'Not reachable',
            }),
        ),
      ];
      return create(EmptySchema);
    },
    version: () => create(EngineVersionSchema, { version: '0.2.0-mock', protocol: 2 }),
  };

  private launch(duty: CommandArgs<'launch'>) {
    const map = duty.map ?? '';
    const bus = duty.bus ?? '';
    if (!duty.tutorial && (!map || !bus)) {
      throw new Error('Choose a bus and a map first.');
    }
    const pid = this.nextPid++;
    const lan = duty.lan ?? 'off';
    const game = create(InstanceSchema, {
      id: `game-${pid}`,
      pid,
      processStarted: secs(),
      slot: this.instances.length,
      log: `C:\\Users\\jakob\\.neoomsi\\game${this.instances.length ? `-${this.instances.length}` : ''}.log`,
      started: secs(),
      map: MAPS.find((m) => m.file === map)?.friendly ?? map,
      bus: VEHICLES.find((v) => v.file === bus)?.name ?? bus,
      entry: duty.entry,
      line: duty.line,
      tour: duty.tour,
      profile: duty.profile ?? CONFIG.profile,
      lan,
      args: ['--map', map, '--bus', bus, '--time', duty.time ?? ''],
      running: true,
      lanStatus:
        lan === 'host'
          ? {
              role: LanRole.HOST,
              name: CONFIG.profile,
              code: 'OMSI-7KQ2-M4XD-9PRT',
              players: [
                {
                  id: 1,
                  name: CONFIG.profile,
                  bus,
                  line: duty.line ?? '',
                  passengers: 0,
                  drawn: true,
                },
              ],
              connected: true,
              hostName: CONFIG.profile,
              map,
            }
          : undefined,
      lastLine: 'Loading map tiles 12 / 94',
    });
    this.instances.push(game);
    return create(LaunchedSchema, {
      pid,
      log: game.log,
      command: 'neoomsi.exe',
      others: this.instances.filter((i) => i.running).length - 1,
    });
  }

  private stop(pid: number) {
    const instance = this.instances.find((i) => i.pid === pid);
    if (!instance) throw new Error(`No game with process ${pid}`);
    instance.running = false;
    instance.ended = secs();
    instance.exitCode = 0;
    instance.lanStatus = undefined;
    instance.lastLine = 'Session saved, goodbye.';
    return create(StoppedSchema, { endedByItself: true });
  }

  private log(pid: number, lines = 200) {
    const instance = this.instances.find((i) => i.pid === pid);
    if (!instance) return [];
    const started = Number(instance.started);
    const until = Number(instance.ended ?? secs());
    const ticks = Math.min(400, Math.floor((until - started) / 3));
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
        const at = new Date((started + k * 3) * 1000).toTimeString().slice(0, 8);
        return `${at} ${events[(k * 7 + pid) % events.length]}`;
      }),
      ...(instance.exitCode
        ? ['ERROR access violation in Sceneryobjects/Ampel/ampel.sco script, line 212']
        : []),
      instance.lastLine,
    ].slice(-lines);
  }

  private join(text: string): JoinCheck {
    const value = text.trim();
    if (/^OMSI(-[A-Z0-9]{4}){2,}$/.test(value.toUpperCase())) {
      return {
        ...create(JoinCheckSchema, { ok: true, text: 'The host drives on Berlin-Spandau 1989' }),
        map: 'maps/Berlin-Spandau/global.cfg',
      };
    }
    const address = value.match(
      /^(\d{1,3}(?:\.\d{1,3}){3}|[a-z0-9-]+(?:\.[a-z0-9-]+)+)(?::(\d+))?$/i,
    );
    if (address) {
      return create(JoinCheckSchema, {
        ok: true,
        text: `Joins ${address[1]} on port ${address[2] ?? '7777'}`,
      });
    }
    return create(JoinCheckSchema, {
      ok: false,
      text: 'This is neither a session code nor an address',
    });
  }

  private install(path: string, mode: InstallMode): InstallProgress {
    const job = create(InstallProgressSchema, {
      id: this.jobs.reduce((max, j) => (j.id > max ? j.id : max), 0n) + 1n,
      source: path,
      name: (path.split(/[\\/]/).pop() ?? path).replace(/\.(zip|7z|rar)$/i, ''),
      state: InstallState.QUEUED,
      mode: mode === InstallMode.UNSPECIFIED ? InstallMode.AUTO : mode,
      freeBytes: MODS.freeBytes,
      message: 'waiting for the install before it',
      started: secs(),
    });
    this.jobs.unshift(job);
    this.jobTicks.set(job.id, 0);
    return job;
  }

  get installing() {
    return this.jobs.some((j) => j.finished === undefined);
  }

  get installs() {
    return this.jobs;
  }

  get games() {
    return this.instances;
  }

  /** Moves every running install on by one step; true when one of them finished. */
  advanceJobs() {
    let finished = false;
    for (const job of this.jobs) {
      if (job.finished !== undefined) continue;
      const tick = (this.jobTicks.get(job.id) ?? 0) + 1;
      this.jobTicks.set(job.id, tick);
      this.stepJob(job, tick);
      finished ||= job.finished !== undefined;
    }
    return finished;
  }

  private stepJob(job: InstallProgress, tick: number) {
    const unpackSteps = 6;
    const bytes = Number(job.bytesTotal) || mockSize(job.name);
    const files = Number(job.filesTotal) || Math.max(12, Math.round(bytes / 2_600_000));
    const inPlace = job.mode === InstallMode.IN_PLACE;
    const archive = /\.(zip|7z|rar)$/i.test(job.source);
    const dest = inPlace ? `Archives/${job.source.split(/[\\/]/).pop()}` : mockDest(job.name);
    if (tick === 1) {
      job.state = InstallState.PLANNING;
      job.message = archive ? "reading the archive's table of contents" : 'listing the folder';
      job.report = [`${job.name} -> ${dest}/ (${files} files, ${mockGb(bytes)})`];
    } else if (tick === 2) {
      job.state = InstallState.CHECKING;
      job.message = 'checking the free disk space';
      job.filesTotal = BigInt(files);
      job.bytesTotal = BigInt(bytes);
      job.neededBytes = BigInt(bytes + 512 * 1024 * 1024);
    } else if (tick < 3 + unpackSteps) {
      const done = (tick - 2) / unpackSteps;
      job.state = archive && !inPlace ? InstallState.UNPACKING : InstallState.COPYING;
      job.message = inPlace
        ? `copying the archive (${mockGb(bytes)})`
        : `${files} files, ${mockGb(bytes)}`;
      job.filesTotal = BigInt(files);
      job.bytesTotal = BigInt(bytes);
      job.filesDone = BigInt(Math.round(files * done));
      job.bytesDone = BigInt(Math.round(bytes * done));
    } else if (tick === 3 + unpackSteps) {
      job.state = InstallState.MOVING;
      job.message = inPlace
        ? 'putting the archive into place'
        : 'moving the files into the content folder';
      job.filesDone = BigInt(files);
      job.bytesDone = BigInt(bytes);
    } else {
      job.state = InstallState.DONE;
      job.message = `installed ${dest} - it is in the lists now`;
      job.report = [...job.report, job.message];
      job.installed = [dest];
      job.finished = secs();
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
    return create(SourceInfoSchema, {
      freeBytes: MODS.freeBytes,
      fits: true,
      inPlace: 'only a .zip archive can be used in place',
      suggested: InstallMode.EXTRACT,
    });
  }
  const name = (path.split(/[\\/]/).pop() ?? path).replace(/\.(zip|7z|rar)$/i, '');
  const unpacked = /komplett|complete|xxl/i.test(name) ? 260_000_000_000 : mockSize(name);
  const needed = unpacked + 512 * 1024 * 1024;
  const fits = BigInt(needed) <= MODS.freeBytes;
  const zip = ext === 'zip';
  return create(SourceInfoSchema, {
    isArchive: true,
    isZip: zip,
    files: BigInt(Math.max(12, Math.round(unpacked / 2_600_000))),
    unpackedBytes: BigInt(unpacked),
    archiveBytes: BigInt(Math.round(unpacked * 0.58)),
    neededBytes: BigInt(needed),
    freeBytes: MODS.freeBytes,
    fits,
    inPlace: zip ? '' : '7z and RAR archives must be unpacked',
    inPlaceOk: zip,
    suggested: !fits && zip ? InstallMode.IN_PLACE : InstallMode.EXTRACT,
  });
}
