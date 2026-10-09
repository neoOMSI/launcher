import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create, type MessageInitShape } from '@bufbuild/protobuf';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { ProcessEngineClient } from '../../electron/process-client';
import { encodeFrame, FrameDecoder } from '../../electron/protocol';
import {
  EngineVersionSchema,
  FrameSchema,
  RequestSchema,
  StatusCode,
  type Frame,
  type Response,
} from '../types/launcher';

const commandOf = (f: Frame) => (f.body.case === 'request' ? f.body.value.command.case : undefined);

const reply = (to: Frame, answer: MessageInitShape<typeof FrameSchema>['body']) =>
  encodeFrame(create(FrameSchema, { requestId: to.requestId, body: answer }));

const answer = (to: Frame, value: Response['answer']) =>
  reply(to, { case: 'response', value: { answer: value } });

const ALL_COMMANDS = RequestSchema.oneofs[0].fields.map((f) => f.name);

const handshake = (to: Frame, supportedCapabilities: string[], commands = ALL_COMMANDS) =>
  reply(to, {
    case: 'response',
    value: {
      answer: {
        case: 'handshake',
        value: {
          status: { code: StatusCode.OK, message: 'OK' },
          protocolVersion: '3',
          engineVersion: '0.5.0',
          supportedCapabilities,
          commands,
        },
      },
    },
  });

const failure = (to: Frame, error: string) =>
  encodeFrame(create(FrameSchema, { requestId: to.requestId, error }));

interface MockChild extends EventEmitter {
  pid: number;
  exitCode: number | null;
  signalCode: string | null;
  stdout: PassThrough;
  stderr: PassThrough;
  stdin: PassThrough;
  kill: (signal?: string) => boolean;
}

function createMockChild(): ChildProcessWithoutNullStreams {
  const emitter = new EventEmitter() as unknown as MockChild;
  emitter.pid = 9999;
  emitter.exitCode = null;
  emitter.signalCode = null;
  emitter.stdout = new PassThrough();
  emitter.stderr = new PassThrough();
  emitter.stdin = new PassThrough();
  emitter.kill = vi.fn((_sig?: string) => {
    emitter.exitCode = 0;
    emitter.emit('close', 0, null);
    return true;
  });
  return emitter as unknown as ChildProcessWithoutNullStreams;
}

function getMockStreams(child: ChildProcessWithoutNullStreams): MockChild {
  return child as unknown as MockChild;
}

describe('ProcessEngineClient', () => {
  let mockChild: ChildProcessWithoutNullStreams;

  beforeEach(() => {
    mockChild = createMockChild();
  });

  it('performs handshake during start and updates connection status', async () => {
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => mockChild,
    });

    const streams = getMockStreams(mockChild);
    const decoder = new FrameDecoder();
    streams.stdin.on('data', (chunk: Buffer) => {
      const messages = decoder.push(chunk);
      for (const msg of messages) {
        if (commandOf(msg) === 'handshake') {
          const responseFrame = handshake(msg, ['content.discovery']);
          streams.stdout.write(responseFrame);
        }
      }
    });

    const status = await client.start();
    expect(status.connectionState).toBe('connected');
    expect(status.engineVersion).toBe('0.5.0');
    expect(status.capabilities).toEqual(['content.discovery']);
  });

  it('cleans up process and state on start handshake failure, allowing clean retry', async () => {
    let attempts = 0;
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 50,
      spawner: () => {
        attempts++;
        mockChild = createMockChild();
        const streams = getMockStreams(mockChild);
        if (attempts === 2) {
          const decoder = new FrameDecoder();
          streams.stdin.on('data', (chunk: Buffer) => {
            const messages = decoder.push(chunk);
            for (const msg of messages) {
              if (commandOf(msg) === 'handshake') {
                streams.stdout.write(handshake(msg, []));
              }
            }
          });
        }
        return mockChild;
      },
    });

    await expect(client.start()).rejects.toThrow(/timed out/);
    expect(client.getStatus().connectionState).toBe('error');

    const status = await client.start();
    expect(status.connectionState).toBe('connected');
    expect(attempts).toBe(2);
  });

  it('rejects pending requests when request times out', async () => {
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 50,
      spawner: () => mockChild,
    });

    const streams = getMockStreams(mockChild);
    const decoder = new FrameDecoder();
    streams.stdin.on('data', (chunk: Buffer) => {
      const messages = decoder.push(chunk);
      for (const msg of messages) {
        if (commandOf(msg) === 'handshake') {
          streams.stdout.write(handshake(msg, []));
        }
      }
    });

    await client.start();

    await expect(client.sendRequest('config', {})).rejects.toThrow(/timed out after 50ms/);
  });

  it('rejects pending requests when the process terminates', async () => {
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 2000,
      spawner: () => mockChild,
    });

    const streams = getMockStreams(mockChild);
    const decoder = new FrameDecoder();
    streams.stdin.on('data', (chunk: Buffer) => {
      const messages = decoder.push(chunk);
      for (const msg of messages) {
        if (commandOf(msg) === 'handshake') {
          streams.stdout.write(handshake(msg, []));
        }
      }
    });

    await client.start();

    const requestPromise = client.sendRequest('maps', {});
    streams.emit('close', 1, null);

    await expect(requestPromise).rejects.toThrow('Process exited with code 1');
    expect(client.getStatus().connectionState).toBe('disconnected');
  });

  it('rejects request when message contains an error', async () => {
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => mockChild,
    });

    const streams = getMockStreams(mockChild);
    const decoder = new FrameDecoder();
    streams.stdin.on('data', (chunk: Buffer) => {
      const messages = decoder.push(chunk);
      for (const msg of messages) {
        if (commandOf(msg) === 'handshake') {
          streams.stdout.write(handshake(msg, []));
        } else if (commandOf(msg) === 'version') {
          streams.stdout.write(failure(msg, 'Explicit engine failure'));
        }
      }
    });

    await client.start();

    await expect(client.sendRequest('version', {})).rejects.toThrow('Explicit engine failure');
  });

  it('rejects pending requests upon calling stop()', async () => {
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 2000,
      spawner: () => mockChild,
    });

    const streams = getMockStreams(mockChild);
    const decoder = new FrameDecoder();
    streams.stdin.on('data', (chunk: Buffer) => {
      const messages = decoder.push(chunk);
      for (const msg of messages) {
        if (commandOf(msg) === 'handshake') {
          streams.stdout.write(handshake(msg, []));
        }
      }
    });

    await client.start();

    const pendingReq = client.sendRequest('servers', {});
    await client.stop();

    await expect(pendingReq).rejects.toThrow('Engine client stopped');
    expect(client.getStatus().connectionState).toBe('disconnected');
  });

  it('handles stdin write errors and terminates connection cleanly', async () => {
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => mockChild,
    });

    const streams = getMockStreams(mockChild);
    const decoder = new FrameDecoder();
    streams.stdin.on('data', (chunk: Buffer) => {
      const messages = decoder.push(chunk);
      for (const msg of messages) {
        if (commandOf(msg) === 'handshake') {
          streams.stdout.write(handshake(msg, []));
        }
      }
    });

    await client.start();

    // Mock stdin write callback error to simulate EPIPE
    const originalWrite = streams.stdin.write.bind(streams.stdin);
    vi.spyOn(streams.stdin, 'write').mockImplementation((chunk: unknown, ...args: unknown[]) => {
      const lastArg = args[args.length - 1];
      if (typeof lastArg === 'function') {
        lastArg(new Error('EPIPE: broken pipe'));
        return false;
      }
      return originalWrite(chunk as Parameters<typeof originalWrite>[0]);
    });

    await expect(client.sendRequest('maps', {})).rejects.toThrow(/EPIPE: broken pipe/);
    expect(client.getStatus().connectionState).toBe('disconnected');
  });

  it('handles asynchronous stdin error events and updates connection state', async () => {
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => mockChild,
    });

    const streams = getMockStreams(mockChild);
    const decoder = new FrameDecoder();
    streams.stdin.on('data', (chunk: Buffer) => {
      const messages = decoder.push(chunk);
      for (const msg of messages) {
        if (commandOf(msg) === 'handshake') {
          streams.stdout.write(handshake(msg, []));
        }
      }
    });

    await client.start();

    let diagnosticLogged = false;
    client.on('diagnostic', (log) => {
      if (log.toLowerCase().includes('stdin error')) {
        diagnosticLogged = true;
      }
    });

    streams.stdin.emit('error', new Error('stream failure'));
    expect(client.getStatus().connectionState).toBe('disconnected');
    expect(diagnosticLogged).toBe(true);
  });

  it('terminates connection when receiving invalid protocol frames from engine', async () => {
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => mockChild,
    });

    const streams = getMockStreams(mockChild);
    const decoder = new FrameDecoder();
    streams.stdin.on('data', (chunk: Buffer) => {
      const messages = decoder.push(chunk);
      for (const msg of messages) {
        if (commandOf(msg) === 'handshake') {
          streams.stdout.write(handshake(msg, []));
        }
      }
    });

    await client.start();

    const corruptHeader = Buffer.alloc(4);
    corruptHeader.writeUInt32BE(100 * 1024 * 1024, 0);

    streams.stdout.write(corruptHeader);

    expect(client.getStatus().connectionState).toBe('disconnected');
    expect(client.getStatus().lastError).toMatch(/Protocol error/);
  });

  it('ignores stale close events from a previously failed child process after a new one starts', async () => {
    let spawnCount = 0;
    let childA: ChildProcessWithoutNullStreams | null = null;
    let childB: ChildProcessWithoutNullStreams | null = null;

    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 50,
      spawner: () => {
        spawnCount++;
        if (spawnCount === 1) {
          childA = createMockChild();
          return childA;
        } else {
          childB = createMockChild();
          const streamsB = getMockStreams(childB);
          const decoder = new FrameDecoder();
          streamsB.stdin.on('data', (chunk: Buffer) => {
            const messages = decoder.push(chunk);
            for (const msg of messages) {
              if (commandOf(msg) === 'handshake') {
                streamsB.stdout.write(handshake(msg, ['content.discovery']));
              }
            }
          });
          return childB;
        }
      },
    });

    await expect(client.start()).rejects.toThrow(/timed out/);
    expect(client.getStatus().connectionState).toBe('error');
    expect(childA).not.toBeNull();

    const status = await client.start();
    expect(status.connectionState).toBe('connected');
    expect(childB).not.toBeNull();

    const streamsA = getMockStreams(childA!);
    streamsA.emit('close', 1, null);

    expect(client.getStatus().connectionState).toBe('connected');
    expect(client.getStatus().engineVersion).toBe('0.5.0');
  });

  it('synchronizes concurrent start() invocations and shares the same handshake', async () => {
    let spawnCalls = 0;
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => {
        spawnCalls++;
        const streams = getMockStreams(mockChild);
        const decoder = new FrameDecoder();
        streams.stdin.on('data', (chunk: Buffer) => {
          const messages = decoder.push(chunk);
          for (const msg of messages) {
            if (commandOf(msg) === 'handshake') {
              setTimeout(() => {
                streams.stdout.write(handshake(msg, []));
              }, 20);
            }
          }
        });
        return mockChild;
      },
    });

    const [res1, res2] = await Promise.all([client.start(), client.start()]);

    expect(spawnCalls).toBe(1);
    expect(res1.connectionState).toBe('connected');
    expect(res2.connectionState).toBe('connected');
    expect(res1).toEqual(res2);
  });

  it('awaits child process exit during stop()', async () => {
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => mockChild,
    });

    const streams = getMockStreams(mockChild);
    const decoder = new FrameDecoder();
    streams.stdin.on('data', (chunk: Buffer) => {
      const messages = decoder.push(chunk);
      for (const msg of messages) {
        if (commandOf(msg) === 'handshake') {
          streams.stdout.write(handshake(msg, []));
        }
      }
    });

    await client.start();

    let closed = false;
    streams.kill = vi.fn((_sig?: string) => {
      setTimeout(() => {
        closed = true;
        streams.emit('close', 0, null);
      }, 50);
      return true;
    });

    await client.stop();

    expect(closed).toBe(true);
    expect(client.getStatus().connectionState).toBe('disconnected');
  });

  it('handles stop() called during an in-flight handshake cleanly, ending in disconnected', async () => {
    let childA: ChildProcessWithoutNullStreams | null = null;
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 1000,
      spawner: () => {
        childA = createMockChild();
        return childA;
      },
    });

    const startPromise = client.start();

    expect(client.getStatus().connectionState).toBe('handshaking');

    await client.stop();

    await expect(startPromise).rejects.toThrow();

    expect(client.getStatus().connectionState).toBe('disconnected');
    expect(client.getStatus().lastError).toBeUndefined();
  });

  it('serializes start() called while a previous child is still stopping', async () => {
    let spawnCount = 0;
    let childA: ChildProcessWithoutNullStreams | null = null;
    let childB: ChildProcessWithoutNullStreams | null = null;
    let childAClosed = false;

    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => {
        spawnCount++;
        if (spawnCount === 1) {
          childA = createMockChild();
          const streamsA = getMockStreams(childA);
          const decoder = new FrameDecoder();
          streamsA.stdin.on('data', (chunk: Buffer) => {
            const msgs = decoder.push(chunk);
            for (const msg of msgs) {
              if (commandOf(msg) === 'handshake') {
                streamsA.stdout.write(handshake(msg, []));
              }
            }
          });
          streamsA.kill = vi.fn((_sig?: string) => {
            setTimeout(() => {
              childAClosed = true;
              streamsA.exitCode = 0;
              streamsA.emit('close', 0, null);
            }, 60);
            return true;
          });
          return childA;
        } else {
          expect(childAClosed).toBe(true);
          childB = createMockChild();
          const streamsB = getMockStreams(childB);
          const decoder = new FrameDecoder();
          streamsB.stdin.on('data', (chunk: Buffer) => {
            const msgs = decoder.push(chunk);
            for (const msg of msgs) {
              if (commandOf(msg) === 'handshake') {
                streamsB.stdout.write(handshake(msg, ['content.discovery']));
              }
            }
          });
          return childB;
        }
      },
    });

    await client.start();
    expect(client.getStatus().connectionState).toBe('connected');

    const stopPromise = client.stop();
    const startBPromise = client.start();

    await stopPromise;
    const finalStatus = await startBPromise;

    expect(spawnCount).toBe(2);
    expect(childAClosed).toBe(true);
    expect(finalStatus.connectionState).toBe('connected');
    expect(finalStatus.capabilities).toEqual(['content.discovery']);
  });

  it('resets negotiated versions and capabilities upon stop()', async () => {
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => mockChild,
    });

    const streams = getMockStreams(mockChild);
    const decoder = new FrameDecoder();
    streams.stdin.on('data', (chunk: Buffer) => {
      const msgs = decoder.push(chunk);
      for (const msg of msgs) {
        if (commandOf(msg) === 'handshake') {
          streams.stdout.write(handshake(msg, ['content.discovery', 'settings.read_write']));
        }
      }
    });

    await client.start();
    const connectedStatus = client.getStatus();
    expect(connectedStatus.connectionState).toBe('connected');
    expect(connectedStatus.protocolVersion).toBe('3');
    expect(connectedStatus.engineVersion).toBe('0.5.0');
    expect(connectedStatus.capabilities).toEqual(['content.discovery', 'settings.read_write']);

    await client.stop();
    const stoppedStatus = client.getStatus();
    expect(stoppedStatus.connectionState).toBe('disconnected');
    expect(stoppedStatus.protocolVersion).toBeUndefined();
    expect(stoppedStatus.engineVersion).toBeUndefined();
    expect(stoppedStatus.capabilities).toEqual([]);
    expect(stoppedStatus.pid).toBeUndefined();
  });

  it('resets negotiated versions and capabilities upon unexpected process exit', async () => {
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => mockChild,
    });

    const streams = getMockStreams(mockChild);
    const decoder = new FrameDecoder();
    streams.stdin.on('data', (chunk: Buffer) => {
      const msgs = decoder.push(chunk);
      for (const msg of msgs) {
        if (commandOf(msg) === 'handshake') {
          streams.stdout.write(handshake(msg, ['content.discovery']));
        }
      }
    });

    await client.start();
    expect(client.getStatus().connectionState).toBe('connected');

    streams.emit('close', 1, null);

    const crashedStatus = client.getStatus();
    expect(crashedStatus.connectionState).toBe('disconnected');
    expect(crashedStatus.protocolVersion).toBeUndefined();
    expect(crashedStatus.engineVersion).toBeUndefined();
    expect(crashedStatus.capabilities).toEqual([]);
    expect(crashedStatus.pid).toBeUndefined();
    expect(crashedStatus.lastError).toMatch(/Process exited with code 1/);
  });

  it('resets negotiated versions and capabilities upon failed reconnect', async () => {
    let attempts = 0;
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 50,
      spawner: () => {
        attempts++;
        const child = createMockChild();
        const streams = getMockStreams(child);
        if (attempts === 1) {
          const decoder = new FrameDecoder();
          streams.stdin.on('data', (chunk: Buffer) => {
            const msgs = decoder.push(chunk);
            for (const msg of msgs) {
              if (commandOf(msg) === 'handshake') {
                streams.stdout.write(handshake(msg, ['content.discovery']));
              }
            }
          });
        }
        return child;
      },
    });

    await client.start();
    expect(client.getStatus().capabilities).toEqual(['content.discovery']);

    await client.stop();

    await expect(client.start()).rejects.toThrow();

    const failedStatus = client.getStatus();
    expect(failedStatus.connectionState).toBe('error');
    expect(failedStatus.protocolVersion).toBeUndefined();
    expect(failedStatus.engineVersion).toBeUndefined();
    expect(failedStatus.capabilities).toEqual([]);
    expect(failedStatus.lastError).toBeDefined();
  });

  it('returns a defensive copy of capabilities array from getStatus()', async () => {
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => mockChild,
    });

    const streams = getMockStreams(mockChild);
    const decoder = new FrameDecoder();
    streams.stdin.on('data', (chunk: Buffer) => {
      const msgs = decoder.push(chunk);
      for (const msg of msgs) {
        if (commandOf(msg) === 'handshake') {
          streams.stdout.write(handshake(msg, ['content.discovery']));
        }
      }
    });

    await client.start();
    const status1 = client.getStatus();
    status1.capabilities.push('corrupted_capability');

    const status2 = client.getStatus();
    expect(status2.capabilities).toEqual(['content.discovery']);
  });

  it('waits for child termination to complete before allowing a retry after handshake failure', async () => {
    let spawnCount = 0;
    let childAClosed = false;
    let childAKilledWithSigterm = false;
    let triggerChildAClose: () => void = () => {};

    const childA = new EventEmitter() as unknown as MockChild;
    childA.pid = 1001;
    childA.exitCode = null;
    childA.signalCode = null;
    childA.stdout = new PassThrough();
    childA.stderr = new PassThrough();
    childA.stdin = new PassThrough();
    childA.kill = vi.fn((sig?: string) => {
      if (sig === 'SIGTERM') {
        childAKilledWithSigterm = true;
      }
      return true;
    });
    triggerChildAClose = () => {
      childA.exitCode = 0;
      childAClosed = true;
      childA.emit('close', 0, null);
    };

    const childB = createMockChild();
    const streamsB = getMockStreams(childB);
    const decoderB = new FrameDecoder();
    streamsB.stdin.on('data', (chunk: Buffer) => {
      const msgs = decoderB.push(chunk);
      for (const msg of msgs) {
        if (commandOf(msg) === 'handshake') {
          streamsB.stdout.write(handshake(msg, ['content.discovery']));
        }
      }
    });

    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 50,
      spawner: () => {
        spawnCount++;
        if (spawnCount === 1) {
          return childA as unknown as ChildProcessWithoutNullStreams;
        }
        return childB;
      },
    });

    // Keep child A alive after SIGTERM to verify retries wait for actual process exit.
    let start1Settled = false;
    const start1Promise = client.start().catch((err) => {
      start1Settled = true;
      throw err;
    });

    await new Promise((r) => setTimeout(r, 80));

    expect(start1Settled).toBe(false);
    expect(childAKilledWithSigterm).toBe(true);
    expect(childAClosed).toBe(false);

    triggerChildAClose();

    await expect(start1Promise).rejects.toThrow(/timed out/);
    expect(start1Settled).toBe(true);

    const status = await client.start();
    expect(spawnCount).toBe(2);
    expect(status.connectionState).toBe('connected');
  });

  it('waits for child termination to complete before allowing retry after protocol error', async () => {
    let spawnCount = 0;
    let childAClosed = false;
    let triggerChildAClose: () => void = () => {};

    const childA = new EventEmitter() as unknown as MockChild;
    childA.pid = 2001;
    childA.exitCode = null;
    childA.signalCode = null;
    childA.stdout = new PassThrough();
    childA.stderr = new PassThrough();
    childA.stdin = new PassThrough();
    childA.kill = vi.fn(() => true);
    triggerChildAClose = () => {
      childA.exitCode = 0;
      childAClosed = true;
      childA.emit('close', 0, null);
    };

    const decoderA = new FrameDecoder();
    childA.stdin.on('data', (chunk: Buffer) => {
      const msgs = decoderA.push(chunk);
      for (const msg of msgs) {
        if (commandOf(msg) === 'handshake') {
          childA.stdout.write(handshake(msg, ['content.discovery']));
        }
      }
    });

    const childB = createMockChild();
    const streamsB = getMockStreams(childB);
    const decoderB = new FrameDecoder();
    streamsB.stdin.on('data', (chunk: Buffer) => {
      const msgs = decoderB.push(chunk);
      for (const msg of msgs) {
        if (commandOf(msg) === 'handshake') {
          streamsB.stdout.write(handshake(msg, ['content.discovery']));
        }
      }
    });

    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => {
        spawnCount++;
        if (spawnCount === 1) {
          return childA as unknown as ChildProcessWithoutNullStreams;
        }
        return childB;
      },
    });

    await client.start();
    expect(client.getStatus().connectionState).toBe('connected');

    const corruptHeader = Buffer.alloc(4);
    corruptHeader.writeUInt32BE(100 * 1024 * 1024, 0);
    childA.stdout.write(corruptHeader);

    expect(client.getStatus().connectionState).toBe('disconnected');
    expect(client.getStatus().lastError).toMatch(/Protocol error/);
    expect(childAClosed).toBe(false);

    let childBSpawned = false;
    const retryPromise = client.start().then((res) => {
      childBSpawned = true;
      return res;
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(spawnCount).toBe(1);
    expect(childBSpawned).toBe(false);

    triggerChildAClose();

    const status = await retryPromise;
    expect(spawnCount).toBe(2);
    expect(childBSpawned).toBe(true);
    expect(status.connectionState).toBe('connected');
  });

  it('keeps stop() pending when a termination is already running until the child exits', async () => {
    let childClosed = false;
    let triggerChildClose: () => void = () => {};

    const child = new EventEmitter() as unknown as MockChild;
    child.pid = 3001;
    child.exitCode = null;
    child.signalCode = null;
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = new PassThrough();
    child.kill = vi.fn(() => true);
    triggerChildClose = () => {
      child.exitCode = 0;
      childClosed = true;
      child.emit('close', 0, null);
    };

    const decoder = new FrameDecoder();
    child.stdin.on('data', (chunk: Buffer) => {
      const msgs = decoder.push(chunk);
      for (const msg of msgs) {
        if (commandOf(msg) === 'handshake') {
          child.stdout.write(handshake(msg, ['content.discovery']));
        }
      }
    });

    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => child as unknown as ChildProcessWithoutNullStreams,
    });

    await client.start();
    expect(client.getStatus().connectionState).toBe('connected');

    const corruptHeader = Buffer.alloc(4);
    corruptHeader.writeUInt32BE(100 * 1024 * 1024, 0);
    child.stdout.write(corruptHeader);

    expect(client.getStatus().connectionState).toBe('disconnected');
    expect(childClosed).toBe(false);

    let stopResolved = false;
    const stopPromise = client.stop().then(() => {
      stopResolved = true;
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(stopResolved).toBe(false);

    triggerChildClose();

    await stopPromise;
    expect(stopResolved).toBe(true);
    expect(childClosed).toBe(true);
  });

  it('waits for child exit after SIGKILL before allowing retry to spawn', async () => {
    let spawnCount = 0;
    let sigkillSent = false;
    let childAClosed = false;
    let triggerChildAClose: () => void = () => {};

    const childA = new EventEmitter() as unknown as MockChild;
    childA.pid = 4001;
    childA.exitCode = null;
    childA.signalCode = null;
    childA.stdout = new PassThrough();
    childA.stderr = new PassThrough();
    childA.stdin = new PassThrough();
    childA.kill = vi.fn((sig?: string) => {
      if (sig === 'SIGKILL') {
        sigkillSent = true;
      }
      return true;
    });
    triggerChildAClose = () => {
      childA.exitCode = null;
      childA.signalCode = 'SIGKILL';
      childAClosed = true;
      childA.emit('close', null, 'SIGKILL');
    };

    const childB = createMockChild();
    const streamsB = getMockStreams(childB);
    const decoderB = new FrameDecoder();
    streamsB.stdin.on('data', (chunk: Buffer) => {
      const msgs = decoderB.push(chunk);
      for (const msg of msgs) {
        if (commandOf(msg) === 'handshake') {
          streamsB.stdout.write(handshake(msg, ['content.discovery']));
        }
      }
    });

    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 50,
      spawner: () => {
        spawnCount++;
        if (spawnCount === 1) {
          return childA as unknown as ChildProcessWithoutNullStreams;
        }
        return childB;
      },
    });

    let start1Settled = false;
    const start1Promise = client.start().catch((err) => {
      start1Settled = true;
      throw err;
    });

    // Wait past SIGTERM grace period for SIGKILL to fire.
    await new Promise((r) => setTimeout(r, 3150));

    expect(start1Settled).toBe(false);
    expect(sigkillSent).toBe(true);
    expect(childAClosed).toBe(false);

    triggerChildAClose();

    await expect(start1Promise).rejects.toThrow(/timed out/);
    expect(start1Settled).toBe(true);

    const status = await client.start();
    expect(spawnCount).toBe(2);
    expect(status.connectionState).toBe('connected');
  }, 10000);

  async function connected(
    onRequest: (msg: Frame, write: (b: Buffer) => void) => void,
    commands = ALL_COMMANDS,
  ) {
    const client = new ProcessEngineClient({
      enginePath: 'neoomsi-engine',
      requestTimeoutMs: 500,
      spawner: () => mockChild,
    });
    const streams = getMockStreams(mockChild);
    const decoder = new FrameDecoder();
    const write = (b: Buffer) => streams.stdout.write(b);
    streams.stdin.on('data', (chunk: Buffer) => {
      for (const msg of decoder.push(chunk)) {
        if (commandOf(msg) === 'handshake') write(handshake(msg, [], commands));
        else onRequest(msg, write);
      }
    });
    await client.start();
    return { client, write };
  }

  it('answers a request with its own command only', async () => {
    const { client } = await connected((msg, write) => {
      if (commandOf(msg) === 'version') {
        write(
          answer(msg, { case: 'version', value: create(EngineVersionSchema, { protocol: 2 }) }),
        );
      } else {
        write(answer(msg, { case: 'version', value: create(EngineVersionSchema) }));
      }
    });
    await expect(client.sendRequest('version', {})).resolves.toMatchObject({ protocol: 2 });
    await expect(client.sendRequest('maps', {})).rejects.toThrow("answered 'maps' with 'version'");
  });

  it('passes events on as they are typed', async () => {
    const { client, write } = await connected(() => {});
    const events: unknown[] = [];
    client.on('event', (e) => events.push(e));
    write(
      encodeFrame(
        create(FrameSchema, {
          body: {
            case: 'event',
            value: { event: { case: 'contentChanged', value: { stamp: 's2' } } },
          },
        }),
      ),
    );
    expect(events).toMatchObject([{ case: 'contentChanged', value: { stamp: 's2' } }]);
  });

  it('refuses a command the engine did not list without sending it', async () => {
    const seen: (string | undefined)[] = [];
    const { client } = await connected((msg) => seen.push(commandOf(msg)), ['maps']);
    await expect(client.sendRequest('servers', {})).rejects.toThrow("has no command 'servers'");
    await expect(client.sendRequest('teleport', {})).rejects.toThrow("has no command 'teleport'");
    expect(seen).toEqual([]);
  });
});
