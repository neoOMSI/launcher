import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { encodeFrame, FrameDecoder, type ProtocolMessage } from './protocol';
import type { EngineClient } from './client';
import type { EngineStatus, HandshakeResponse, SessionEvent } from '../src/types/scaffold';
import { StatusCode } from '../src/types/scaffold';

export interface ProcessEngineClientOptions {
  enginePath: string;
  engineArgs?: string[];
  requestTimeoutMs?: number;
  maxFrameSizeBytes?: number;
  launcherVersion?: string;
  spawner?: (
    command: string,
    args: readonly string[],
    options: unknown,
  ) => ChildProcessWithoutNullStreams;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
}

export class ProcessEngineClient extends EventEmitter implements EngineClient {
  private readonly options: ProcessEngineClientOptions;
  private process: ChildProcessWithoutNullStreams | null = null;
  private startPromise: Promise<EngineStatus> | null = null;
  private stopPromise: Promise<void> | null = null;
  private isStopping = false;
  private terminationPromise: Promise<void> | null = null;
  private readonly decoder: FrameDecoder;
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private requestCounter = 0;
  private status: EngineStatus = {
    connectionState: 'disconnected',
    capabilities: [],
  };

  constructor(options: ProcessEngineClientOptions) {
    super();
    this.options = {
      requestTimeoutMs: 15000,
      ...options,
    };
    this.decoder = new FrameDecoder(options.maxFrameSizeBytes);
  }

  public getStatus(): EngineStatus {
    return {
      ...this.status,
      capabilities: [...this.status.capabilities],
    };
  }

  public async start(): Promise<EngineStatus> {
    if (this.stopPromise) {
      await this.stopPromise;
    }

    if (this.terminationPromise) {
      await this.terminationPromise;
    }

    if (this.status.connectionState === 'connected') {
      return this.getStatus();
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    this.isStopping = false;
    this.startPromise = this.performStart().finally(() => {
      this.startPromise = null;
    });

    return this.startPromise;
  }

  private async performStart(): Promise<EngineStatus> {
    this.updateStatus({
      connectionState: 'starting',
      pid: undefined,
      protocolVersion: undefined,
      engineVersion: undefined,
      capabilities: [],
      lastError: undefined,
    });

    const args = this.options.engineArgs ?? ['--control-protocol'];
    const spawnFn = this.options.spawner ?? spawn;
    const child = spawnFn(this.options.enginePath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.process = child;

    this.updateStatus({
      connectionState: 'handshaking',
      pid: child.pid,
      protocolVersion: undefined,
      engineVersion: undefined,
      capabilities: [],
    });

    child.stdout.on('data', (chunk: Buffer) => {
      if (this.process !== child) return;
      try {
        const messages = this.decoder.push(chunk);
        for (const msg of messages) {
          this.handleIncoming(msg);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.emit('diagnostic', `[Protocol Error] ${errorMsg}`);
        this.handleProcessTermination(child, `Protocol error: ${errorMsg}`);
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      if (this.process !== child) return;
      const line = chunk.toString('utf-8');
      this.emit('diagnostic', line);
    });

    child.stdin.on('error', (err: Error) => {
      if (this.process !== child) return;
      this.emit('diagnostic', `[stdin Error] ${err.message}`);
      this.handleProcessTermination(child, `stdin error: ${err.message}`);
    });

    child.on('error', (err: Error) => {
      if (this.process !== child) return;
      this.emit('diagnostic', `[Process Error] ${err.message}`);
      this.handleProcessTermination(child, err.message);
    });

    child.on('close', (code: number | null, signal: string | null) => {
      if (this.process !== child) return;
      const reason = signal
        ? `Process killed by signal ${signal}`
        : `Process exited with code ${code ?? 0}`;
      this.emit('diagnostic', `[Engine Closed] ${reason}`);
      this.handleProcessTermination(child, code !== 0 ? reason : undefined);
    });

    try {
      const handshake = await this.sendRequest<HandshakeResponse>('handshake', {
        protocolVersion: '1.0',
        launcherVersion: this.options.launcherVersion ?? '0.3.0',
        clientPlatform: process.platform,
      });

      if (handshake.status.code === StatusCode.STATUS_OK) {
        this.updateStatus({
          connectionState: 'connected',
          protocolVersion: handshake.protocolVersion,
          engineVersion: handshake.engineVersion,
          capabilities: [...handshake.supportedCapabilities],
          lastError: undefined,
        });
      } else {
        throw new Error(`Handshake failed: ${handshake.status.message}`);
      }

      return this.getStatus();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (this.process === child) {
        this.process = null;
      }
      this.decoder.clear();
      this.rejectAllPending(new Error(`Failed to start engine: ${errorMsg}`));

      if (!this.isStopping) {
        this.updateStatus({
          connectionState: 'error',
          pid: undefined,
          protocolVersion: undefined,
          engineVersion: undefined,
          capabilities: [],
          lastError: errorMsg,
        });
      }

      if (this.terminationPromise) {
        await this.terminationPromise;
      } else {
        await this.terminateChild(child);
      }
      throw err;
    }
  }

  public async stop(): Promise<void> {
    if (this.stopPromise) {
      return this.stopPromise;
    }

    this.isStopping = true;
    this.stopPromise = this.performStop().finally(() => {
      this.stopPromise = null;
      this.isStopping = false;
    });

    return this.stopPromise;
  }

  private async performStop(): Promise<void> {
    const child = this.process;
    this.process = null;
    this.decoder.clear();
    this.rejectAllPending(new Error('Engine client stopped'));

    if (this.startPromise) {
      try {
        await this.startPromise;
      } catch {
        // Expected cancellation of start in flight
      }
    }

    if (this.terminationPromise) {
      try {
        await this.terminationPromise;
      } catch {
        // Ignore
      }
    }

    this.updateStatus({
      connectionState: 'disconnected',
      pid: undefined,
      protocolVersion: undefined,
      engineVersion: undefined,
      capabilities: [],
      lastError: undefined,
    });

    if (child) {
      await this.terminateChild(child);
    }
  }

  private async terminateChild(child: ChildProcessWithoutNullStreams): Promise<void> {
    if (typeof child.exitCode === 'number' || child.signalCode !== null) {
      return;
    }

    await new Promise<void>((resolve) => {
      let resolved = false;
      let forceKillTimer: NodeJS.Timeout | null = null;
      let safetyTimer: NodeJS.Timeout | null = null;

      const finish = () => {
        if (!resolved) {
          resolved = true;
          if (forceKillTimer) clearTimeout(forceKillTimer);
          if (safetyTimer) clearTimeout(safetyTimer);
          child.removeListener('close', finish);
          child.removeListener('exit', finish);
          resolve();
        }
      };

      child.once('close', finish);
      child.once('exit', finish);

      forceKillTimer = setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {
          // Ignore
        }
        // Safety timeout in case SIGKILL is unhandled by the OS/mock
        safetyTimer = setTimeout(finish, 2000);
      }, 3000);

      try {
        child.kill('SIGTERM');
      } catch {
        finish();
      }
    });
  }

  public async sendRequest<T>(type: string, payload: unknown): Promise<T> {
    if (
      !this.process ||
      (this.status.connectionState !== 'connected' && this.status.connectionState !== 'handshaking')
    ) {
      throw new Error(`Cannot send request '${type}': engine is ${this.status.connectionState}`);
    }

    const requestId = `req_${Date.now()}_${++this.requestCounter}`;
    const timeoutMs = this.options.requestTimeoutMs ?? 15000;

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request '${type}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(requestId, {
        resolve: resolve as (val: unknown) => void,
        reject,
        timer,
      });

      try {
        const frame = encodeFrame({ type, payload, requestId });
        const proc = this.process;
        if (!proc) {
          throw new Error('Engine process is not running');
        }
        proc.stdin.write(frame, (err) => {
          if (err) {
            clearTimeout(timer);
            this.pendingRequests.delete(requestId);
            reject(new Error(`Failed to write to stdin: ${err.message}`));
            this.handleProcessTermination(proc, `stdin write error: ${err.message}`);
          }
        });
      } catch (err: unknown) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  private handleIncoming(msg: ProtocolMessage): void {
    if (msg.requestId && this.pendingRequests.has(msg.requestId)) {
      const pending = this.pendingRequests.get(msg.requestId)!;
      this.pendingRequests.delete(msg.requestId);
      clearTimeout(pending.timer);

      if (msg.error) {
        pending.reject(new Error(msg.error));
      } else {
        pending.resolve(msg.payload);
      }
      return;
    }

    if (msg.type === 'session_event') {
      this.emit('session_event', msg.payload as SessionEvent);
    }
  }

  private handleProcessTermination(
    child: ChildProcessWithoutNullStreams,
    lastError?: string,
  ): void {
    if (this.process !== child) {
      return;
    }
    this.process = null;
    this.decoder.clear();
    this.rejectAllPending(new Error(lastError || 'Engine process exited'));
    if (!this.isStopping) {
      this.updateStatus({
        connectionState: 'disconnected',
        pid: undefined,
        protocolVersion: undefined,
        engineVersion: undefined,
        capabilities: [],
        lastError,
      });
    }
    this.terminationPromise = this.terminateChild(child).finally(() => {
      this.terminationPromise = null;
    });
  }

  private rejectAllPending(error: Error): void {
    for (const [id, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  private updateStatus(patch: Partial<EngineStatus>): void {
    this.status = { ...this.status, ...patch };
    this.emit('status', this.getStatus());
  }
}
