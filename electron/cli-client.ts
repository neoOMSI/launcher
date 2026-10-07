import { execFile } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type { EngineClient } from './client';
import type { EngineStatus } from '../src/types/scaffold';
import type { Config } from '../src/types/launcher';

const SLOW: Record<string, number> = { vehicles: 300_000, preview: 300_000, mods: 300_000 };

const CACHED = new Set(['config', 'maps', 'vehicles', 'weather']);
const CACHE_MS = 30_000;

// Commands the game window has without a `--cli` equivalent yet.
const EMPTY: Record<string, unknown> = {
  tutorials: [],
  servers: [],
  controllers: [],
  situations: [],
};

export class CliEngineClient extends EventEmitter implements EngineClient {
  private status: EngineStatus = { connectionState: 'disconnected', capabilities: [] };
  private readonly cache = new Map<string, { at: number; value: Promise<unknown> }>();

  constructor(private readonly launcherPath: string) {
    super();
  }

  getStatus(): EngineStatus {
    return { ...this.status, capabilities: [...this.status.capabilities] };
  }

  async start(): Promise<EngineStatus> {
    this.update({ connectionState: 'starting', capabilities: [], lastError: undefined });
    try {
      const config = await this.run<Config>('config', {});
      this.emit('diagnostic', `[CLI] ${this.launcherPath}`);
      this.emit('diagnostic', `[CLI] OMSI 2 folder: ${config.root || '(not found)'}`);
      this.update({
        connectionState: 'connected',
        protocolVersion: 'cli',
        engineVersion: config.game,
        capabilities: ['launcher.cli'],
      });
    } catch (err) {
      this.update({
        connectionState: 'error',
        capabilities: [],
        lastError: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
    return this.getStatus();
  }

  async stop(): Promise<void> {
    this.update({ connectionState: 'disconnected', capabilities: [], engineVersion: undefined });
  }

  sendRequest<T>(type: string, payload: unknown): Promise<T> {
    if (this.status.connectionState !== 'connected') {
      return Promise.reject(new Error('The neoOMSI launcher CLI is not connected'));
    }
    if (type in EMPTY) return Promise.resolve(EMPTY[type] as T);
    if (!CACHED.has(type)) {
      if (type === 'save_settings' || type === 'install') this.cache.clear();
      return this.run<T>(type, payload);
    }
    const hit = this.cache.get(type);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as Promise<T>;
    const value = this.run<T>(type, payload);
    this.cache.set(type, { at: Date.now(), value });
    value.catch(() => this.cache.delete(type));
    return value;
  }

  private run<T>(command: string, args: unknown): Promise<T> {
    const started = Date.now();
    return new Promise((resolve, reject) => {
      execFile(
        this.launcherPath,
        ['--cli', command, JSON.stringify(args ?? {})],
        { maxBuffer: 256 * 1024 * 1024, timeout: SLOW[command] ?? 60_000, windowsHide: true },
        (err, stdout, stderr) => {
          const ms = Date.now() - started;
          if (err) {
            const message = stderr.replace(/^error:\s*/i, '').trim() || err.message;
            this.emit('diagnostic', `[CLI] ${command} failed after ${ms} ms: ${message}`);
            reject(new Error(message));
            return;
          }
          if (ms > 1000) this.emit('diagnostic', `[CLI] ${command} took ${ms} ms`);
          try {
            resolve(JSON.parse(stdout) as T);
          } catch {
            reject(new Error(`${command}: the CLI did not answer with JSON`));
          }
        },
      );
    });
  }

  private update(patch: Partial<EngineStatus>) {
    this.status = { ...this.status, ...patch };
    this.emit('status', this.getStatus());
  }
}
