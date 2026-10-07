import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type {
  EngineStatus,
  GetMapsResponse,
  GetSettingsResponse,
  GetVehiclesResponse,
  SessionEvent,
  StartSessionRequest,
  StartSessionResponse,
  Status,
} from '../src/types/scaffold';
import type { NeoomsiBridge } from '../src/types/neoomsi';
import type { Command, CommandArgs, CommandResult } from '../src/types/launcher';

const api: NeoomsiBridge = {
  call: <C extends Command>(command: C, args?: CommandArgs<C>): Promise<CommandResult<C>> =>
    ipcRenderer.invoke('engine:call', command, args),
  getMaps: (filter?: string): Promise<GetMapsResponse> =>
    ipcRenderer.invoke('engine:get-maps', filter),
  getVehicles: (filter?: string): Promise<GetVehiclesResponse> =>
    ipcRenderer.invoke('engine:get-vehicles', filter),
  getSettings: (): Promise<GetSettingsResponse> => ipcRenderer.invoke('engine:get-settings'),
  updateSettings: (settingsJson: string): Promise<Status> =>
    ipcRenderer.invoke('engine:update-settings', settingsJson),
  startSession: (req: StartSessionRequest): Promise<StartSessionResponse> =>
    ipcRenderer.invoke('engine:start-session', req),
  stopSession: (sessionId: string): Promise<Status> =>
    ipcRenderer.invoke('engine:stop-session', sessionId),
  previewModel: (bus: string, paint: string): Promise<Uint8Array> =>
    ipcRenderer.invoke('engine:preview-model', bus, paint),
  mapPicture: (mapFile: string): Promise<Uint8Array | null> =>
    ipcRenderer.invoke('engine:map-picture', mapFile),
  getEngineStatus: (): Promise<EngineStatus> => ipcRenderer.invoke('engine:get-status'),
  startEngine: (): Promise<EngineStatus> => ipcRenderer.invoke('engine:start'),
  stopEngine: (): Promise<void> => ipcRenderer.invoke('engine:stop'),

  onEngineStatus: (callback: (status: EngineStatus) => void) => {
    const handler = (_: IpcRendererEvent, status: EngineStatus) => callback(status);
    ipcRenderer.on('engine:status-changed', handler);
    return () => ipcRenderer.removeListener('engine:status-changed', handler);
  },

  onSessionEvent: (callback: (event: SessionEvent) => void) => {
    const handler = (_: IpcRendererEvent, event: SessionEvent) => callback(event);
    ipcRenderer.on('engine:session-event', handler);
    return () => ipcRenderer.removeListener('engine:session-event', handler);
  },

  onDiagnosticLog: (callback: (log: string) => void) => {
    const handler = (_: IpcRendererEvent, log: string) => callback(log);
    ipcRenderer.on('engine:diagnostic-log', handler);
    return () => ipcRenderer.removeListener('engine:diagnostic-log', handler);
  },
};

contextBridge.exposeInMainWorld('neoomsi', api);
