import type { EventEmitter } from 'node:events';
import type { EngineStatus } from '../src/types/scaffold';

export interface EngineClient extends EventEmitter {
  getStatus(): EngineStatus;
  start(): Promise<EngineStatus>;
  stop(): Promise<void>;
  sendRequest<T>(type: string, payload: unknown): Promise<T>;
}
