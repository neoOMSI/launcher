import { describe, expect, it } from 'vitest';
import { categoryOf } from '../pages/controls/categories';
import { addKey, conflicts, countChanges, unbind } from '../pages/controls/model';

const bind = (action: string, scan_code: number, modifier = 0) => ({ action, scan_code, modifier });

describe('controls categories', () => {
  it('sorts vehicle triggers into categories', () => {
    expect(categoryOf('throttle', 'vehicles')).toBe('driving');
    expect(categoryOf('parking_brake_toggle', 'vehicles')).toBe('driving');
    expect(categoryOf('kw_s_R', 'vehicles')).toBe('gearbox');
    expect(categoryOf('automatic_D', 'vehicles')).toBe('gearbox');
    expect(categoryOf('kw_scheinwerfer_toggle', 'vehicles')).toBe('lights');
    expect(categoryOf('blinker_warn_toggle', 'vehicles')).toBe('lights');
    expect(categoryOf('bus_doorfront0', 'vehicles')).toBe('doors');
    expect(categoryOf('cp_haltestellenbremse_kneeling', 'vehicles')).toBe('doors');
    expect(categoryOf('IBIS_eingabe', 'vehicles')).toBe('ibis');
    expect(categoryOf('cashdesk_changer_2_00', 'vehicles')).toBe('ibis');
    expect(categoryOf('bus_rollband_setT', 'vehicles')).toBe('ibis');
    expect(categoryOf('kw_wipermode_up', 'vehicles')).toBe('cab');
    expect(categoryOf('my_custom_trigger', 'vehicles')).toBe('cab');
  });

  it('keeps game triggers in game, views, VR or editor', () => {
    expect(categoryOf('view_set_driver', 'game')).toBe('views');
    expect(categoryOf('vr_recenter', 'game')).toBe('vr');
    expect(categoryOf('scendes_grabmode', 'game')).toBe('editor');
    expect(categoryOf('quicksave', 'game')).toBe('game');
    expect(categoryOf('toggel_mouse_ctrl', 'game')).toBe('game');
  });
});

describe('controls model', () => {
  it('finds keys shared by several actions, ignoring the hold flag', () => {
    const list = [bind('a', 19), bind('b', 19, 1), bind('c', 19, 4), bind('d', 0)];
    expect([...conflicts(list).values()]).toEqual([['a', 'b']]);
  });

  it('counts changed actions and unbinds the last key in place', () => {
    const before = { vehicles: [bind('horn', 35)], game: [] };
    const added = { ...before, vehicles: addKey(before.vehicles, 'horn', 36, 0) };
    expect(countChanges(before, added)).toBe(1);
    expect(unbind(before.vehicles, 0)).toEqual([bind('horn', 0)]);
  });
});
