import { describe, it, expect } from 'vitest';
import { Buffer } from 'node:buffer';
import { create } from '@bufbuild/protobuf';
import { encodeFrame, FrameDecoder, ProtocolError } from '../../electron/protocol';
import { FrameSchema } from '../types/launcher';

const request = (requestId: string, map: string) =>
  create(FrameSchema, {
    requestId,
    body: { case: 'request', value: { command: { case: 'lines', value: { map } } } },
  });

describe('Protocol framing', () => {
  it('encodes and decodes a single frame correctly', () => {
    const decoder = new FrameDecoder();
    const frame = request('req_1', 'maps/Grundorf/global.cfg');

    const encoded = encodeFrame(frame);
    expect(encoded.length).toBeGreaterThan(4);

    const decoded = decoder.push(encoded);
    expect(decoded).toEqual([frame]);
    expect(decoder.pendingBytes).toBe(0);
  });

  it('decodes multiple frames received in a single chunk', () => {
    const decoder = new FrameDecoder();
    const frames = [request('1', 'a'), request('2', 'b'), create(FrameSchema, { error: 'no' })];

    const decoded = decoder.push(Buffer.concat(frames.map((f) => encodeFrame(f))));
    expect(decoded).toEqual(frames);
    expect(decoder.pendingBytes).toBe(0);
  });

  it('decodes frames fragmented across arbitrary chunk boundaries', () => {
    const decoder = new FrameDecoder();
    const frame = request('req_split', 'Hello fragmented world');

    const bytes = encodeFrame(frame);
    expect(decoder.push(bytes.subarray(0, 2))).toEqual([]);
    expect(decoder.pendingBytes).toBe(2);
    expect(decoder.push(bytes.subarray(2, 7))).toEqual([]);
    expect(decoder.pendingBytes).toBe(7);
    expect(decoder.push(bytes.subarray(7))).toEqual([frame]);
    expect(decoder.pendingBytes).toBe(0);
  });

  it('rejects frames exceeding the maximum size limit in encodeFrame', () => {
    expect(() => encodeFrame(request('big', 'a'.repeat(200)), 100)).toThrow(ProtocolError);
  });

  it('rejects oversized frame headers in FrameDecoder and clears buffer', () => {
    const decoder = new FrameDecoder(1024);

    const corruptHeader = Buffer.alloc(4);
    corruptHeader.writeUInt32BE(5 * 1024 * 1024, 0);

    expect(() => decoder.push(corruptHeader)).toThrow(ProtocolError);
    expect(decoder.pendingBytes).toBe(0);
  });

  it('throws ProtocolError on bytes that are no frame and clears buffer', () => {
    const decoder = new FrameDecoder();

    const body = Buffer.from([0xff, 0xff, 0xff, 0xff]);
    const header = Buffer.alloc(4);
    header.writeUInt32BE(body.length, 0);

    expect(() => decoder.push(Buffer.concat([header, body, header]))).toThrow(ProtocolError);
    expect(decoder.pendingBytes).toBe(0);
  });

  it('throws ProtocolError on a JSON frame of the first protocol', () => {
    const decoder = new FrameDecoder();

    const body = Buffer.from(JSON.stringify({ type: 'handshake', payload: {} }), 'utf-8');
    const header = Buffer.alloc(4);
    header.writeUInt32BE(body.length, 0);

    expect(() => decoder.push(Buffer.concat([header, body]))).toThrow(ProtocolError);
  });

  it('clears pending bytes on clear()', () => {
    const decoder = new FrameDecoder();
    decoder.push(Buffer.from([0, 0, 0, 10])); // Partial frame
    expect(decoder.pendingBytes).toBe(4);
    decoder.clear();
    expect(decoder.pendingBytes).toBe(0);
  });
});
