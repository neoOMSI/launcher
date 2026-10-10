import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS_FIXTURE, PAGE_SETTINGS } from '../fixtures/settings';
import de from '../i18n/pages/settings.de.json';
import en from '../i18n/pages/settings.en.json';
import { TABS, settingKeys } from '../pages/settings/schema';
import { shown } from '../pages/settings/rows';

describe('Settings Fixture Regression', () => {
  it('matches engine default settings', () => {
    expect(DEFAULT_SETTINGS_FIXTURE.graphics.graphics).toBe('vanilla_plus');
    expect(DEFAULT_SETTINGS_FIXTURE.graphics.msaa).toBe(4);
    expect(DEFAULT_SETTINGS_FIXTURE.graphics.reflections).toBe(true);

    expect(DEFAULT_SETTINGS_FIXTURE.audio['master-volume']).toBe(1.0);
    expect(DEFAULT_SETTINGS_FIXTURE.audio['ai-volume']).toBe(1.0);
    expect(DEFAULT_SETTINGS_FIXTURE.audio['scenery-volume']).toBe(1.0);
    expect(DEFAULT_SETTINGS_FIXTURE.audio.doppler).toBe(true);

    expect(DEFAULT_SETTINGS_FIXTURE.gameplay.collision_vehicles).toBe(true);
    expect(DEFAULT_SETTINGS_FIXTURE.gameplay.collision_objects).toBe(true);
    expect(DEFAULT_SETTINGS_FIXTURE.gameplay.collision_pedestrians).toBe(true);

    expect(DEFAULT_SETTINGS_FIXTURE.passengers.density).toBe(1.0);
    expect(DEFAULT_SETTINGS_FIXTURE.camera.head_pitch).toBe(0.0);

    expect(DEFAULT_SETTINGS_FIXTURE.ui.language).toBe('ENG');

    expect(DEFAULT_SETTINGS_FIXTURE.launcher.update_check).toBe(true);
    expect(DEFAULT_SETTINGS_FIXTURE.launcher.update_auto).toBe(false);
  });

  it('does not contain removed stale settings', () => {
    const fixture = DEFAULT_SETTINGS_FIXTURE as Record<string, unknown>;
    const launcherCategory = fixture.launcher as Record<string, unknown>;
    expect(launcherCategory.rest).toBeUndefined();

    const gameplayCategory = fixture.gameplay as Record<string, unknown>;
    expect(gameplayCategory.use_real_time).toBeUndefined();
    expect(gameplayCategory.use_real_date).toBeUndefined();
    expect(gameplayCategory.use_real_year).toBeUndefined();

    const controllerCategory = fixture.controller as Record<string, unknown>;
    expect(controllerCategory.off).toBeUndefined();
  });

  it('maps every settings row to an engine key', () => {
    const page = new Set(PAGE_SETTINGS.map(([key]) => key));
    const rows = TABS.filter((tab) => tab.id !== 'launcher').flatMap(settingKeys);
    expect(rows.filter((key) => !page.has(key))).toEqual([]);
  });

  it('offers head pitch from -45 to 45 degrees in one degree steps', () => {
    const row = TABS.find((tab) => tab.id === 'camera')?.groups
      .flatMap((group) => group.rows)
      .find((candidate) => candidate.key === 'head_pitch');
    expect(row?.control).toMatchObject({ kind: 'slider', min: -45, max: 45, step: 1 });
  });

  it('uses a unique key for the head pitch reset and hides it without settings', () => {
    const rows = TABS.find((tab) => tab.id === 'camera')?.groups
      .find((group) => group.id === 'seat')?.rows;
    expect(new Set(rows?.map((row) => row.key)).size).toBe(rows?.length);
    const reset = rows?.find((row) => row.key === 'head_pitch_reset');
    expect(reset?.control).toMatchObject({
      kind: 'custom',
      id: 'headPitch',
      writes: ['head_pitch'],
    });
    expect(reset && shown(reset, null)).toBe(false);
  });

  it('labels every settings row in English and German', () => {
    const rows = TABS.flatMap((tab) => tab.groups.flatMap((g) => g.rows));
    for (const { rows: labels, hints } of [en, de] as {
      rows: Record<string, string>;
      hints: Record<string, string>;
    }[]) {
      expect(rows.filter((r) => !labels[r.key]).map((r) => r.key)).toEqual([]);
      expect(rows.filter((r) => r.hint && !hints[r.key]).map((r) => r.key)).toEqual([]);
    }
  });
});
