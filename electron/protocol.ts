import { Buffer } from 'node:buffer';

export interface ProtocolMessage<T = unknown> {
  type: string;
  payload: T;
  requestId?: string;
  error?: string;
}

export const DEFAULT_MAX_FRAME_SIZE_BYTES = 16 * 1024 * 1024; // 16 MB

export class ProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProtocolError';
  }
}

export function encodeFrame(
  message: ProtocolMessage,
  maxSizeBytes: number = DEFAULT_MAX_FRAME_SIZE_BYTES,
): Buffer {
  const jsonStr = JSON.stringify(message);
  const data = Buffer.from(jsonStr, 'utf-8');

  if (data.length > maxSizeBytes) {
    throw new ProtocolError(
      `Frame size (${data.length} bytes) exceeds maximum allowed size (${maxSizeBytes} bytes)`,
    );
  }

  const frame = Buffer.alloc(4 + data.length);
  frame.writeUInt32BE(data.length, 0);
  data.copy(frame, 4);
  return frame;
}

export class FrameDecoder {
  private buffer: Buffer = Buffer.alloc(0);
  private readonly maxSizeBytes: number;

  constructor(maxSizeBytes: number = DEFAULT_MAX_FRAME_SIZE_BYTES) {
    this.maxSizeBytes = maxSizeBytes;
  }

  public push(chunk: Buffer): ProtocolMessage[] {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const messages: ProtocolMessage[] = [];

    while (this.buffer.length >= 4) {
      const length = this.buffer.readUInt32BE(0);

      if (length > this.maxSizeBytes) {
        // Discard buffered data after a framing violation.
        this.buffer = Buffer.alloc(0);
        throw new ProtocolError(
          `Received frame length (${length} bytes) exceeds maximum limit (${this.maxSizeBytes} bytes)`,
        );
      }

      if (this.buffer.length < 4 + length) {
        break;
      }

      const raw = this.buffer.subarray(4, 4 + length).toString('utf-8');
      this.buffer = this.buffer.subarray(4 + length);

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (err: unknown) {
        this.buffer = Buffer.alloc(0);
        const detail = err instanceof Error ? err.message : String(err);
        throw new ProtocolError(`Failed to parse frame JSON payload: ${detail}`);
      }

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        typeof (parsed as Record<string, unknown>).type !== 'string'
      ) {
        this.buffer = Buffer.alloc(0);
        throw new ProtocolError('Invalid protocol frame: missing "type" string property');
      }

      messages.push(parsed as ProtocolMessage);
    }

    return messages;
  }

  public clear(): void {
    this.buffer = Buffer.alloc(0);
  }

  public get pendingBytes(): number {
    return this.buffer.length;
  }
}
