import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Command, CommandArgs, CommandResult, EngineEvent, Instance } from '../types/launcher';
import type { EngineStatus } from '../types/scaffold';
import { gameStart, type GameStart } from './launching';

const stale = new EventTarget();

const AFFECTS: Partial<Record<Command, Command[]>> = {
  save_config: ['config', 'profile', 'profiles', 'maps', 'vehicles', 'weather', 'mods'],
  create_profile: ['config', 'profile', 'profiles'],
  delete_profile: ['config', 'profile', 'profiles'],
  save_settings: ['settings', 'pax_pack'],
  install_pax_pack: ['pax_pack'],
  save_keybindings: ['keybindings'],
  save_servers: ['servers'],
  install: ['mods', 'maps', 'vehicles', 'weather'],
  start_install: ['mods'],
  cancel_install: ['mods'],
  clear_installs: ['mods'],
  uninstall_mod: ['mods', 'maps', 'vehicles', 'weather'],
  launch: ['instances'],
  stop: ['instances'],
};

export function invalidate(...commands: Command[]) {
  for (const command of commands) stale.dispatchEvent(new Event(command));
}

export async function call<C extends Command>(
  command: C,
  args?: CommandArgs<C>,
): Promise<CommandResult<C>> {
  if (!window.neoomsi) throw new Error('The engine bridge is not available');
  const result = await window.neoomsi.call(command, args);
  invalidate(...(AFFECTS[command] ?? []));
  return result;
}

// Electron wraps errors thrown in the main process as "Error invoking remote method '…': Error: …".
export const errorText = (err: unknown) =>
  (err instanceof Error ? err.message : String(err)).replace(
    /^Error invoking remote method '[^']+': (?:\w*Error: )?/,
    '',
  );

interface EngineValue {
  status: EngineStatus;
  ready: boolean;
  logs: string[];
  log: (line: string) => void;
  clearLogs: () => void;
  connect: () => void;
  disconnect: () => void;
  instances: Instance[];
  refreshInstances: () => void;
  launching: GameStart | null;
  noteLaunch: (pid: number) => void;
}

const EngineContext = createContext<EngineValue>({
  status: { connectionState: 'disconnected', capabilities: [] },
  ready: false,
  logs: [],
  log() {},
  clearLogs() {},
  connect() {},
  disconnect() {},
  instances: [],
  refreshInstances() {},
  launching: null,
  noteLaunch() {},
});

export const useEngine = () => useContext(EngineContext);

const CONTENT: Command[] = ['maps', 'vehicles', 'weather', 'lines', 'situations', 'mods'];

export function EngineProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<EngineStatus>({
    connectionState: 'disconnected',
    capabilities: [],
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [launch, setLaunch] = useState<{ pid: number; at: number } | null>(null);
  const [now, setNow] = useState(() => Date.now() / 1000);
  const ready = status.connectionState === 'connected';
  const log = useCallback((line: string) => setLogs((prev) => [...prev, line]), []);

  useEffect(() => {
    if (!window.neoomsi) return;
    const unsubStatus = window.neoomsi.onEngineStatus(setStatus);
    const unsubLogs = window.neoomsi.onDiagnosticLog(log);
    const unsubEvents = window.neoomsi.onEngineEvent((event: EngineEvent) => {
      if (event.type === 'instances_changed') setInstances(event.payload);
      else if (event.type === 'installs_changed') invalidate('mods');
      else if (event.type === 'content_changed') invalidate(...CONTENT);
      else if (event.type === 'pax_pack_changed') invalidate('pax_pack');
    });
    window.neoomsi
      .getEngineStatus()
      .then((s) => {
        setStatus(s);
        if (s.connectionState === 'disconnected') {
          window.neoomsi.startEngine().catch((err) => log(`[Launcher] ${errorText(err)}`));
        }
      })
      .catch((err) => log(`[Launcher] ${errorText(err)}`));
    return () => {
      unsubStatus();
      unsubLogs();
      unsubEvents();
    };
  }, [log]);

  const refreshInstances = useCallback(() => {
    call('instances')
      .then(setInstances)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (ready) refreshInstances();
  }, [ready, refreshInstances]);

  const launching = launch
    ? gameStart(
        instances.find((i) => i.pid === launch.pid),
        launch.at,
        now,
      )
    : null;

  useEffect(() => {
    if (!launch) return;
    if (!launching) {
      setLaunch(null);
      return;
    }
    const timer = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(timer);
  }, [launch, launching === null]);

  const noteLaunch = useCallback((pid: number) => {
    const at = Date.now() / 1000;
    setNow(at);
    setLaunch({ pid, at });
  }, []);

  const connect = () =>
    window.neoomsi?.startEngine().catch((err) => log(`[Launcher] ${errorText(err)}`));
  const disconnect = () =>
    window.neoomsi?.stopEngine().catch((err) => log(`[Launcher] ${errorText(err)}`));

  return (
    <EngineContext
      value={{
        status,
        ready,
        logs,
        log,
        clearLogs: () => setLogs([]),
        connect,
        disconnect,
        instances,
        refreshInstances,
        launching,
        noteLaunch,
      }}
    >
      {children}
    </EngineContext>
  );
}

export function useCommand<C extends Command>(command: C, args?: CommandArgs<C> | null) {
  const { ready } = useEngine();
  const key = JSON.stringify(args ?? null);
  const [state, setState] = useState<{
    data?: CommandResult<C>;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!ready || args === null) return;
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    call(command, args)
      .then((data) => live && setState({ data, loading: false }))
      .catch((err) => live && setState({ error: errorText(err), loading: false }));
    return () => {
      live = false;
    };
  }, [ready, command, key, tick]);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    stale.addEventListener(command, bump);
    return () => stale.removeEventListener(command, bump);
  }, [command]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
