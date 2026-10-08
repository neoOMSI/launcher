import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron';
import type { EngineStatus } from '../src/types/scaffold';
import type { NeoomsiBridge } from '../src/types/neoomsi';
import type { Command, CommandArgs, CommandResult, EngineEvent } from '../src/types/launcher';

function listen<T>(channel: string, callback: (value: T) => void) {
  const handler = (_: IpcRendererEvent, value: T) => callback(value);
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.removeListener(channel, handler);
  };
}

const api: NeoomsiBridge = {
  platform: process.platform,
  call: <C extends Command>(command: C, args?: CommandArgs<C>): Promise<CommandResult<C>> =>
    ipcRenderer.invoke('engine:call', command, args),
  previewModel: (bus: string, paint: string): Promise<Uint8Array> =>
    ipcRenderer.invoke('engine:preview-model', bus, paint),
  mapPicture: (mapFile: string): Promise<Uint8Array | null> =>
    ipcRenderer.invoke('engine:map-picture', mapFile),
  getEngineStatus: (): Promise<EngineStatus> => ipcRenderer.invoke('engine:get-status'),
  startEngine: (): Promise<EngineStatus> => ipcRenderer.invoke('engine:start'),
  stopEngine: (): Promise<void> => ipcRenderer.invoke('engine:stop'),

  onEngineStatus: (callback) => listen<EngineStatus>('engine:status-changed', callback),
  onEngineEvent: (callback) => listen<EngineEvent>('engine:event', callback),
  onDiagnosticLog: (callback) => listen<string>('engine:diagnostic-log', callback),

  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    onMaximized: (callback) => listen<boolean>('window:maximized', callback),
  },
  prefs: {
    get: () => ipcRenderer.invoke('prefs:get'),
    set: (patch) => ipcRenderer.invoke('prefs:set', patch),
  },
  pickFiles: (kind, multiple = false) => ipcRenderer.invoke('dialog:pick-files', kind, multiple),
  pickFolder: (defaultPath) => ipcRenderer.invoke('dialog:pick-folder', defaultPath),
  pathForFile: (file) => webUtils.getPathForFile(file),
  openPath: (path) => ipcRenderer.invoke('shell:open-path', path),
  showItem: (path) => ipcRenderer.invoke('shell:show-item', path),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  appInfo: () => ipcRenderer.invoke('app:info'),
};

contextBridge.exposeInMainWorld('neoomsi', api);
