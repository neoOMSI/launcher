import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Command, CommandArgs, CommandResult, Instance } from '../types/launcher';
import type { EngineStatus } from '../types/scaffold';

export function call<C extends Command>(
  command: C,
  args?: CommandArgs<C>,
): Promise<CommandResult<C>> {
  if (!window.neoomsi) return Promise.reject(new Error('The engine bridge is not available'));
  return window.neoomsi.call(command, args);
}

export const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

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
});

export const useEngine = () => useContext(EngineContext);

export function EngineProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<EngineStatus>({
    connectionState: 'disconnected',
    capabilities: [],
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const ready = status.connectionState === 'connected';
  const log = useCallback((line: string) => setLogs((prev) => [...prev, line]), []);

  useEffect(() => {
    if (!window.neoomsi) return;
    const unsubStatus = window.neoomsi.onEngineStatus(setStatus);
    const unsubLogs = window.neoomsi.onDiagnosticLog(log);
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
    };
  }, [log]);

  const refreshInstances = useCallback(() => {
    call('instances')
      .then(setInstances)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready) return;
    refreshInstances();
    const timer = setInterval(refreshInstances, 2500);
    return () => clearInterval(timer);
  }, [ready, refreshInstances]);

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

  return { ...state, reload: () => setTick((t) => t + 1) };
}
