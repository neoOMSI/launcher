import { describe, it, expect } from 'vitest';
import { create } from '@bufbuild/protobuf';
import { AxisCalibrationSchema, AxisFunction } from '../types/launcher';
import {
  assistResult,
  calibrated,
  mergedCalibration,
  movedMost,
  stepMoved,
  type Axes,
} from '../pages/controls/wizard';

const axes = (...v: (number | undefined)[]): Axes => [...v, ...Array(8 - v.length).fill(undefined)];

describe('Set-up assistant', () => {
  it('finds the wheel and the pedals it was shown', () => {
    const rest = axes(0, -1, -1, 1);
    const found = assistResult(rest, [
      axes(-0.9, -1, -1, 1),
      axes(0, 1, -1, 1),
      axes(0, -1, 1, 1),
      [],
    ]);
    expect(found[0]).toEqual({ function: AxisFunction.STEERING, reversed: false });
    expect(found[1]).toEqual({ function: AxisFunction.THROTTLE, reversed: false });
    expect(found[2]).toEqual({ function: AxisFunction.BRAKE, reversed: false });
    expect(found[3]).toBeUndefined();
  });

  it('takes pedals on one axis as throttle and brake', () => {
    const rest = axes(0, 0);
    const held = [axes(-1, 0), axes(0, 1), axes(0, -1), []];
    expect(assistResult(rest, held)[1]).toEqual({
      function: AxisFunction.THROTTLE_BRAKE,
      reversed: false,
    });
    expect(movedMost(rest, held[1], [1])).toBeUndefined();
  });

  it('wants an axis not taken before, except the brake on the throttle axis', () => {
    const rest = axes(0, 0);
    const steered = [axes(-1, 0)];
    expect(stepMoved(rest, steered, axes(-1, 0), 2)).toBe(false);
    expect(stepMoved(rest, [...steered, axes(0, 1)], axes(0, -1), 3)).toBe(true);
  });
});

describe('Calibration', () => {
  it('stretches the travel seen to the whole range', () => {
    const cal = create(AxisCalibrationSchema, { min: -0.5, max: 0.5 });
    expect(calibrated(cal, 0.5)).toBe(1);
    expect(calibrated(cal, -0.25)).toBe(-0.5);
    expect(calibrated(undefined, 0.3)).toBe(0.3);
  });

  it('keeps an axis that did not move and starts a cleared one afresh', () => {
    const old = create(AxisCalibrationSchema, { min: -0.8, max: 0.9, deadzone: 0.1 });
    expect(mergedCalibration(old, {})).toMatchObject({ min: -0.8, max: 0.9, deadzone: 0.1 });
    expect(mergedCalibration(old, { lo: -0.95, hi: 0.97, centre: 0.01 })).toMatchObject({
      min: -0.95,
      max: 0.97,
      centre: 0.01,
    });
    expect(mergedCalibration(old, { cleared: true })).toBeUndefined();
  });
});
