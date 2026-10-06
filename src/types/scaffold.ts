/**
 * Temporary launcher-side types until the engine-owned protocol bindings exist.
 */

export enum StatusCode {
  STATUS_OK = 0,
  STATUS_ERROR = 1,
  STATUS_UNSUPPORTED_VERSION = 2,
  STATUS_NOT_FOUND = 3,
  STATUS_INVALID_ARGUMENT = 4,
}

export interface Status {
  code: StatusCode;
  message: string;
  diagnostics?: string[];
}

export interface HandshakeResponse {
  status: Status;
  protocolVersion: string;
  engineVersion: string;
  supportedCapabilities: string[];
}

export interface MapSummary {
  id: string;
  name: string;
  relativePath: string;
  description: string;
  tileCount: number;
  hasChronology: boolean;
}

export interface VehicleSummary {
  id: string;
  name: string;
  manufacturer: string;
  relativePath: string;
  availablePaints: string[];
  availableHofs: string[];
}

export interface GetMapsResponse {
  status: Status;
  maps: MapSummary[];
}

export interface GetVehiclesResponse {
  status: Status;
  vehicles: VehicleSummary[];
}

export interface GetSettingsResponse {
  status: Status;
  settingsJson: string;
}

export enum SessionState {
  SESSION_UNKNOWN = 0,
  SESSION_STARTING = 1,
  SESSION_LOADING = 2,
  SESSION_RUNNING = 3,
  SESSION_STOPPING = 4,
  SESSION_EXITED = 5,
  SESSION_FAILED = 6,
}

export interface StartSessionRequest {
  mapId: string;
  vehicleId: string;
  profileId: string;
  entryPoint?: string;
  simTimeEpochSeconds?: number;
  weatherPreset?: string;
  situationFile?: string;
}

export interface StartSessionResponse {
  status: Status;
  sessionId?: string;
}

export interface SessionEvent {
  sessionId: string;
  state: SessionState;
  message: string;
  exitCode?: number;
}

export type EngineConnectionState =
  'disconnected' | 'starting' | 'handshaking' | 'connected' | 'error';

export interface EngineStatus {
  connectionState: EngineConnectionState;
  protocolVersion?: string;
  engineVersion?: string;
  capabilities: string[];
  lastError?: string;
  pid?: number;
}
