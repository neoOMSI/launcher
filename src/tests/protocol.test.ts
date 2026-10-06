import { describe, it, expect } from 'vitest';
import { Buffer } from 'node:buffer';
import {
  encodeFrame,
  FrameDecoder,
  ProtocolError,
  type ProtocolMessage,
} from '../../electron/protocol';

describe('Protocol framing', () => {
  it('encodes and decodes a single frame correctly', () => {
    const decoder = new FrameDecoder();
    const message: ProtocolMessage = {
      type: 'test_request',
      payload: { foo: 'bar', count: 42 },
      requestId: 'req_1',
    };

    const encoded = encodeFrame(message);
    expect(encoded.length).toBeGreaterThan(4);

    const decoded = decoder.push(encoded);
    expect(decoded).toHaveLength(1);
    expect(decoded[0]).toEqual(message);
    expect(decoder.pendingBytes).toBe(0);
  });

  it('decodes multiple frames received in a single chunk', () => {
    const decoder = new FrameDecoder();
    const msg1: ProtocolMessage = { type: 'first', payload: 1 };
    const msg2: ProtocolMessage = { type: 'second', payload: 2 };
    const msg3: ProtocolMessage = { type: 'third', payload: 3 };

    const combined = Buffer.concat([encodeFrame(msg1), encodeFrame(msg2), encodeFrame(msg3)]);

    const decoded = decoder.push(combined);
    expect(decoded).toHaveLength(3);
    expect(decoded[0]).toEqual(msg1);
    expect(decoded[1]).toEqual(msg2);
    expect(decoded[2]).toEqual(msg3);
    expect(decoder.pendingBytes).toBe(0);
  });

  it('decodes frames fragmented across arbitrary chunk boundaries', () => {
    const decoder = new FrameDecoder();
    const message: ProtocolMessage = {
      type: 'fragmented_message',
      payload: { text: 'Hello fragmented world' },
      requestId: 'req_split',
    };

    const frame = encodeFrame(message);
    const part1 = frame.subarray(0, 2);
    const part2 = frame.subarray(2, 7);
    const part3 = frame.subarray(7);

    expect(decoder.push(part1)).toEqual([]);
    expect(decoder.pendingBytes).toBe(2);

    expect(decoder.push(part2)).toEqual([]);
    expect(decoder.pendingBytes).toBe(7);

    const finalResult = decoder.push(part3);
    expect(finalResult).toHaveLength(1);
    expect(finalResult[0]).toEqual(message);
    expect(decoder.pendingBytes).toBe(0);
  });

  it('rejects frames exceeding the maximum size limit in encodeFrame', () => {
    const largeMessage: ProtocolMessage = {
      type: 'huge',
      payload: 'a'.repeat(200),
    };

    expect(() => encodeFrame(largeMessage, 100)).toThrow(ProtocolError);
  });

  it('rejects oversized frame headers in FrameDecoder and clears buffer', () => {
    const decoder = new FrameDecoder(1024);

    const corruptHeader = Buffer.alloc(4);
    corruptHeader.writeUInt32BE(5 * 1024 * 1024, 0);

    expect(() => decoder.push(corruptHeader)).toThrow(ProtocolError);
    expect(decoder.pendingBytes).toBe(0);
  });

  it('throws ProtocolError on malformed JSON and clears buffer', () => {
    const decoder = new FrameDecoder();

    const malformedBody = Buffer.from('{ invalid json !!!', 'utf-8');
    const malformedHeader = Buffer.alloc(4);
    malformedHeader.writeUInt32BE(malformedBody.length, 0);
    const malformedFrame = Buffer.concat([malformedHeader, malformedBody]);

    expect(() => decoder.push(malformedFrame)).toThrow(ProtocolError);
    expect(decoder.pendingBytes).toBe(0);
  });

  it('throws ProtocolError on frames missing the type field and clears buffer', () => {
    const decoder = new FrameDecoder();

    const noTypeBody = Buffer.from(JSON.stringify({ payload: 'no type' }), 'utf-8');
    const header = Buffer.alloc(4);
    header.writeUInt32BE(noTypeBody.length, 0);
    const frame = Buffer.concat([header, noTypeBody]);

    expect(() => decoder.push(frame)).toThrow(ProtocolError);
    expect(decoder.pendingBytes).toBe(0);
  });

  it('clears pending bytes on clear()', () => {
    const decoder = new FrameDecoder();
    decoder.push(Buffer.from([0, 0, 0, 10])); // Partial frame
    expect(decoder.pendingBytes).toBe(4);
    decoder.clear();
    expect(decoder.pendingBytes).toBe(0);
  });
});
