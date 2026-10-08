// Mirrors docs/LAUNCHER_PROTOCOL.md in the neoOMSI repository.

export const PROTOCOL_VERSION = '1';

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
  commands?: string[];
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

export interface SessionEvent {
  sessionId: string;
  pid: number;
  state: SessionState;
  message: string;
  progress?: number;
  exitCode?: number;
}

export type EngineConnectionState =
  'disconnected' | 'starting' | 'handshaking' | 'connected' | 'error';

export interface EngineStatus {
  connectionState: EngineConnectionState;
  protocolVersion?: string;
  engineVersion?: string;
  capabilities: string[];
  commands?: string[];
  lastError?: string;
  pid?: number;
}
