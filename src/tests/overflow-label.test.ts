import { describe, expect, it } from 'vitest';
import { overflowDistance } from '../components/OverflowLabel';

describe('overflowDistance', () => {
  it('does not scroll text that fits', () => {
    expect(overflowDistance(240, 240)).toBe(0);
    expect(overflowDistance(180, 240)).toBe(0);
  });

  it('returns only the distance needed to reveal overflowing text', () => {
    expect(overflowDistance(360, 240)).toBe(120);
  });
});
