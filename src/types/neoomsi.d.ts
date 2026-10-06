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

export interface NeoomsiBridge {
  getMaps(filter?: string): Promise<GetMapsResponse>;
  getVehicles(filter?: string): Promise<GetVehiclesResponse>;
  getSettings(): Promise<GetSettingsResponse>;
  updateSettings(settingsJson: string): Promise<Status>;
  startSession(request: StartSessionRequest): Promise<StartSessionResponse>;
  stopSession(sessionId: string): Promise<Status>;
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
