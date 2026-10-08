import { EventEmitter } from 'node:events';
import type { EngineClient } from './client';
import { PROTOCOL_VERSION, SessionState, type EngineStatus } from '../src/types/scaffold';
import { COMMANDS, type Command, type EngineEvent, type Launched } from '../src/types/launcher';
import { MockLauncher } from './mock/launcher';

const INSTALL_TICK_MS = 700;
const LOAD_STEPS_MS = [400, 1200, 2400];

export class MockEngineClient extends EventEmitter implements EngineClient {
  private readonly launcher = new MockLauncher();
  private ticker: NodeJS.Timeout | null = null;
  private readonly timers = new Set<NodeJS.Timeout>();
  private status: EngineStatus = {
    connectionState: 'disconnected',
    capabilities: [],
  };

  public getStatus(): EngineStatus {
    return {
      ...this.status,
      capabilities: [...this.status.capabilities],
      commands: this.status.commands && [...this.status.commands],
    };
  }

  public async start(): Promise<EngineStatus> {
    this.status = {
      connectionState: 'connected',
      protocolVersion: `${PROTOCOL_VERSION}-mock`,
      engineVersion: '0.2.0-mock',
      capabilities: ['events.instances', 'events.installs', 'events.content', 'events.session'],
      commands: [...COMMANDS],
    };
    this.emit('diagnostic', 'MockEngineClient active');
    this.emit('status', this.getStatus());
    this.watchInstalls();
    return this.getStatus();
  }

  public async stop(): Promise<void> {
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    this.status = { connectionState: 'disconnected', capabilities: [] };
    this.emit('status', this.getStatus());
  }

  public async sendRequest<T>(type: string, payload: unknown): Promise<T> {
    if (this.status.connectionState !== 'connected') {
      throw new Error('Mock engine is not connected');
    }
    if (!(COMMANDS as readonly string[]).includes(type)) {
      throw new Error(`Unsupported mock request type: ${type}`);
    }
    const result = this.launcher.handle(type as Command, payload);
    this.after(type as Command, payload, result);
    return result as T;
  }

  private send(event: EngineEvent) {
    this.emit('event', event);
  }

  private later(ms: number, run: () => void) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      run();
    }, ms);
    timer.unref?.();
    this.timers.add(timer);
  }

  private session(id: string, pid: number, state: SessionState, message = '', progress?: number) {
    this.send({
      type: 'session_event',
      payload: { sessionId: id, pid, state, message, progress },
    });
  }

  private after(command: Command, payload: unknown, result: unknown) {
    switch (command) {
      case 'launch': {
        const { pid } = result as Launched;
        const game = this.launcher.games.find((i) => i.pid === pid);
        if (!game) return;
        this.send({ type: 'instances_changed', payload: this.launcher.games });
        this.session(game.id, pid, SessionState.SESSION_STARTING);
        LOAD_STEPS_MS.forEach((ms, k) => {
          const last = k === LOAD_STEPS_MS.length - 1;
          this.later(ms, () => {
            if (!game.running) return;
            game.link = last
              ? { state: 'running', progress: null, message: '', window: true }
              : {
                  state: 'loading',
                  progress: (k + 1) / LOAD_STEPS_MS.length,
                  message: game.map,
                  window: true,
                };
            this.send({ type: 'instances_changed', payload: this.launcher.games });
            if (last) this.session(game.id, pid, SessionState.SESSION_RUNNING);
            else
              this.session(
                game.id,
                pid,
                SessionState.SESSION_LOADING,
                game.map,
                game.link.progress!,
              );
          });
        });
        return;
      }
      case 'stop': {
        const pid = Number((payload as { pid?: number })?.pid);
        const game = this.launcher.games.find((i) => i.pid === pid);
        if (game) game.link = null;
        this.send({ type: 'instances_changed', payload: this.launcher.games });
        if (game) this.session(game.id, pid, SessionState.SESSION_EXITED, game.last_line);
        return;
      }
      case 'install':
      case 'start_install':
      case 'cancel_install':
      case 'clear_installs':
        this.send({ type: 'installs_changed', payload: this.launcher.installs });
        this.watchInstalls();
        return;
      case 'uninstall_mod':
      case 'save_config':
        this.send({ type: 'content_changed', payload: { stamp: String(Date.now()) } });
        return;
    }
  }

  private watchInstalls() {
    if (this.ticker || !this.launcher.installing) return;
    this.ticker = setInterval(() => {
      const finished = this.launcher.advanceJobs();
      this.send({ type: 'installs_changed', payload: this.launcher.installs });
      if (finished) this.send({ type: 'content_changed', payload: { stamp: String(Date.now()) } });
      if (!this.launcher.installing && this.ticker) {
        clearInterval(this.ticker);
        this.ticker = null;
      }
    }, INSTALL_TICK_MS);
    this.ticker.unref?.();
  }
}
