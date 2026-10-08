import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS_FIXTURE, PAGE_SETTINGS } from '../fixtures/settings';
import de from '../i18n/pages/settings.de.json';
import en from '../i18n/pages/settings.en.json';
import { TABS, settingKeys } from '../pages/settings/schema';

describe('Settings Fixture Regression', () => {
  it('matches engine default settings', () => {
    expect(DEFAULT_SETTINGS_FIXTURE.graphics.graphics).toBe('vanilla_plus');
    expect(DEFAULT_SETTINGS_FIXTURE.graphics.msaa).toBe(4);
    expect(DEFAULT_SETTINGS_FIXTURE.graphics.reflections).toBe(true);

    expect(DEFAULT_SETTINGS_FIXTURE.audio['master-volume']).toBe(1.0);
    expect(DEFAULT_SETTINGS_FIXTURE.audio['ai-volume']).toBe(1.0);
    expect(DEFAULT_SETTINGS_FIXTURE.audio['scenery-volume']).toBe(1.0);
    expect(DEFAULT_SETTINGS_FIXTURE.audio.doppler).toBe(true);

    expect(DEFAULT_SETTINGS_FIXTURE.gameplay['drive-keys']).toBe('simple');
    expect(DEFAULT_SETTINGS_FIXTURE.gameplay.collision_vehicles).toBe(true);
    expect(DEFAULT_SETTINGS_FIXTURE.gameplay.collision_objects).toBe(true);
    expect(DEFAULT_SETTINGS_FIXTURE.gameplay.collision_pedestrians).toBe(true);

    expect(DEFAULT_SETTINGS_FIXTURE.passengers.density).toBe(1.0);

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
