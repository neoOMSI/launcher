export const PROTOCOL_VERSION = '3';

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
