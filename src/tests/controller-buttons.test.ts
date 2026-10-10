import { beforeAll, describe, it, expect } from 'vitest';
import { setLanguage } from '../i18n';
import { buttonLabel } from '../pages/controls/Controllers';

beforeAll(() => setLanguage('en'));

describe('Controller button names', () => {
  it('names a gamepad the way it is printed on it', () => {
    expect(buttonLabel(1, true, true)).toBe('A');
    expect(buttonLabel(4, true, true)).toBe('LB');
    expect(buttonLabel(128, true, true)).toBe('D-pad up');
    expect(buttonLabel(9, true, true)).toBe('Menu');
  });

  it('names the hats of a wheel and numbers everything else', () => {
    expect(buttonLabel(133, false, true)).toBe('Hat 2 right');
    expect(buttonLabel(1, false, true)).toBe('Button 2');
    expect(buttonLabel(1, true, false)).toBe('Button 2');
  });
});
