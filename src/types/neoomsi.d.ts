import type {
  EngineStatus,
  GetMapsResponse,
  GetSettingsResponse,
  GetVehiclesResponse,
  HandshakeResponse,
  SessionEvent,
  StartSessionRequest,
  StartSessionResponse,
  Status,
} from './scaffold';
import type { Command, CommandArgs, CommandResult } from './launcher';

export interface NeoomsiBridge {
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
}

declare global {
  interface Window {
    neoomsi: NeoomsiBridge;
  }
}
