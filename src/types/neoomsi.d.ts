import type {
  EngineStatus,
  GetMapsResponse,
  GetSettingsResponse,
  GetVehiclesResponse,
  SessionEvent,
  StartSessionRequest,
  StartSessionResponse,
  Status,
} from './scaffold';
import type { Command, CommandArgs, CommandResult } from './launcher';

export type OnLaunch = 'keep' | 'minimize' | 'hide';

export interface LauncherPrefs {
  onLaunch: OnLaunch;
  restoreOnExit: boolean;
  updateCheck: boolean;
  window: { x: number; y: number; width: number; height: number; maximized: boolean } | null;
}

export type PickKind = 'mod' | 'engine' | 'any';

export interface AppInfo {
  version: string;
  electron: string;
  chrome: string;
  platform: string;
  arch: string;
  userData: string;
}

export interface UpdateInfo {
  current: string;
  available: boolean;
  latest: {
    version: string;
    name: string;
    url: string;
    notes: string;
    prerelease: boolean;
    published: string;
  } | null;
}

export interface NeoomsiBridge {
  platform: string;
  call<C extends Command>(command: C, args?: CommandArgs<C>): Promise<CommandResult<C>>;
  getMaps(filter?: string): Promise<GetMapsResponse>;
  getVehicles(filter?: string): Promise<GetVehiclesResponse>;
  getSettings(): Promise<GetSettingsResponse>;
  updateSettings(settingsJson: string): Promise<Status>;
  startSession(request: StartSessionRequest): Promise<StartSessionResponse>;
  stopSession(sessionId: string): Promise<Status>;
  previewModel(bus: string, paint: string): Promise<Uint8Array>;
  mapPicture(mapFile: string): Promise<Uint8Array | null>;
  getEngineStatus(): Promise<EngineStatus>;
  startEngine(): Promise<EngineStatus>;
  stopEngine(): Promise<void>;
  onEngineStatus(callback: (status: EngineStatus) => void): () => void;
  onSessionEvent(callback: (event: SessionEvent) => void): () => void;
  onDiagnosticLog(callback: (log: string) => void): () => void;

  window: {
    minimize(): Promise<void>;
    toggleMaximize(): Promise<void>;
    close(): Promise<void>;
    isMaximized(): Promise<boolean>;
    onMaximized(callback: (maximized: boolean) => void): () => void;
  };
  prefs: {
    get(): Promise<LauncherPrefs>;
    set(patch: Partial<LauncherPrefs>): Promise<LauncherPrefs>;
  };
  pickFiles(kind: PickKind, multiple?: boolean): Promise<string[]>;
  pickFolder(defaultPath?: string): Promise<string | null>;
  pathForFile(file: File): string;
  openPath(path: string): Promise<void>;
  showItem(path: string): Promise<void>;
  openExternal(url: string): Promise<void>;
  appInfo(): Promise<AppInfo>;
  checkUpdates(current: string): Promise<UpdateInfo>;
}

declare global {
  interface Window {
    neoomsi: NeoomsiBridge;
  }
}
