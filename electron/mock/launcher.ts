import type {
  Command,
  CommandResult,
  Duty,
  Instance,
  InstallMode,
  InstallProgress,
  Settings,
} from '../../src/types/launcher';
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
  profile,
} from './content';

const now = () => Math.floor(Date.now() / 1000);

export class MockLauncher {
  private settings: Settings = defaultSettings();
  private instances: Instance[] = [];
  private jobs: InstallProgress[] = [...MODS.jobs];
  private nextPid = 18200;

  handle<C extends Command>(command: C, args: unknown): CommandResult<C> {
    return this.dispatch(command, (args ?? {}) as Record<string, unknown>) as CommandResult<C>;
  }

  private dispatch(command: Command, args: Record<string, unknown>): unknown {
    switch (command) {
      case 'config':
        return CONFIG;
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
        return PROFILES;
      case 'profile':
        return profile(String(args.name));
      case 'mods':
        return { ...MODS, jobs: this.jobs };
      case 'install':
        return this.install(String(args.path), (args.mode as InstallMode) ?? 'auto');
      case 'instances':
        return this.instances;
      case 'stop':
        return this.stop(Number(args.pid));
      case 'log':
        return this.log(Number(args.pid));
      case 'join':
        return this.join(String(args.text));
      case 'settings':
        return this.settings;
      case 'save_settings':
        this.settings = { ...this.settings, ...(args as Settings) };
        return this.settings;
      case 'keybindings':
        return KEYBINDINGS;
      case 'launch':
        return this.launch(args as unknown as Duty);
      case 'preview':
        throw new Error(
          'The mock engine has no 3D models. Start the launcher with --cli to see the real bus.',
        );
      case 'tutorials':
        return TUTORIALS;
      case 'servers':
        return SERVERS;
      case 'controllers':
        return CONTROLLERS;
      case 'situations':
        return args.map === 'maps/Berlin-Spandau/global.cfg'
          ? [{ name: 'Line 92, tour 2', file: 'laststn.osn', time: now() - 7200 }]
          : [];
    }
  }

  private launch(duty: Duty) {
    if (!duty.map || !duty.bus) throw new Error('Choose a bus and a map first.');
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
    instance.last_line = 'Session saved, goodbye.';
    return { stopped: true, ended_by_itself: true };
  }

  private log(pid: number) {
    const instance = this.instances.find((i) => i.pid === pid);
    if (!instance) return [];
    return [
      `INFO  neoOMSI 0.2.0 starting, process ${pid}`,
      `INFO  map ${instance.map}`,
      `INFO  bus ${instance.bus}`,
      'INFO  graphics: Vulkan, NVIDIA GeForce RTX 3070',
      'WARN  texture "Sceneryobjects/Bushaltestelle/hst.dds" missing, using a placeholder',
      'INFO  timetable: 3 lines, 9 tours',
      instance.last_line,
    ];
  }

  private join(text: string) {
    const ok = /^OMSI(-[A-Z0-9]{4}){2,}$/.test(text.trim().toUpperCase());
    return {
      ok,
      text: ok ? 'The host drives on Berlin-Spandau 1989' : 'This is not a session code',
    };
  }

  private install(path: string, mode: InstallMode): InstallProgress {
    const name = path.split(/[\\/]/).pop() ?? path;
    const job: InstallProgress = {
      id: this.jobs.length + 1,
      source: path,
      name: name.replace(/\.(zip|7z|rar)$/i, ''),
      state: 'copying',
      mode,
      files_done: 37,
      files_total: 212,
      bytes_done: 18_000_000,
      bytes_total: 104_000_000,
      free_bytes: MODS.free_bytes,
      needed_bytes: 104_000_000,
      message: 'Copying Vehicles…',
      report: [],
      warnings: [],
      installed: [],
      kept_aside: [],
      from_inbox: false,
      started: now(),
      finished: null,
    };
    this.jobs.unshift(job);
    return job;
  }
}
