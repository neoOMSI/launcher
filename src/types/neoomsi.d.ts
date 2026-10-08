import type { EngineStatus } from './scaffold';
import type { Command, CommandArgs, CommandResult, EngineEvent } from './launcher';

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

export interface NeoomsiBridge {
  platform: string;
  call<C extends Command>(command: C, args?: CommandArgs<C>): Promise<CommandResult<C>>;
  previewModel(bus: string, paint: string): Promise<Uint8Array>;
  mapPicture(mapFile: string): Promise<Uint8Array | null>;
  getEngineStatus(): Promise<EngineStatus>;
  startEngine(): Promise<EngineStatus>;
  stopEngine(): Promise<void>;
  onEngineStatus(callback: (status: EngineStatus) => void): () => void;
  onEngineEvent(callback: (event: EngineEvent) => void): () => void;
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
}

declare global {
  interface Window {
    neoomsi: NeoomsiBridge;
  }
}
