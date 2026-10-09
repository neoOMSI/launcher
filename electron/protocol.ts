import { Buffer } from 'node:buffer';
import { fromBinary, toBinary } from '@bufbuild/protobuf';
import { FrameSchema, type Frame } from '../src/types/launcher';

export const DEFAULT_MAX_FRAME_SIZE_BYTES = 16 * 1024 * 1024; // 16 MB

export class ProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProtocolError';
  }
}

export function encodeFrame(
  frame: Frame,
  maxSizeBytes: number = DEFAULT_MAX_FRAME_SIZE_BYTES,
): Buffer {
  const data = toBinary(FrameSchema, frame);

  if (data.length > maxSizeBytes) {
    throw new ProtocolError(
      `Frame size (${data.length} bytes) exceeds maximum allowed size (${maxSizeBytes} bytes)`,
    );
  }

  const out = Buffer.alloc(4 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.set(data, 4);
  return out;
}

export class FrameDecoder {
  private buffer: Buffer = Buffer.alloc(0);
  private readonly maxSizeBytes: number;

  constructor(maxSizeBytes: number = DEFAULT_MAX_FRAME_SIZE_BYTES) {
    this.maxSizeBytes = maxSizeBytes;
  }

  public push(chunk: Buffer): Frame[] {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const frames: Frame[] = [];

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

      const data = this.buffer.subarray(4, 4 + length);
      this.buffer = this.buffer.subarray(4 + length);

      try {
        frames.push(fromBinary(FrameSchema, data));
      } catch (err: unknown) {
        this.buffer = Buffer.alloc(0);
        const detail = err instanceof Error ? err.message : String(err);
        throw new ProtocolError(`Failed to decode a frame: ${detail}`);
      }
    }

    return frames;
  }

  public clear(): void {
    this.buffer = Buffer.alloc(0);
  }

  public get pendingBytes(): number {
    return this.buffer.length;
  }
}
