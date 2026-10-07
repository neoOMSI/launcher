import { describe, it, expect, beforeEach } from 'vitest';
import { translate, setLanguage, getLanguage, interpolate, normalizeLanguage, t } from '../i18n';

describe('i18n', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  it('translates nested keys in English', () => {
    setLanguage('en');
    expect(t('nav.drive')).toBe('Drive');
    expect(t('nav.mods')).toBe('Mods');
    expect(t('nav.settings')).toBe('Settings');
    expect(t('nav.controls')).toBe('Controls');
  });

  it('translates nested keys in German', () => {
    setLanguage('de');
    expect(t('nav.drive')).toBe('Fahren');
    expect(t('nav.timetables')).toBe('Fahrpläne');
    expect(t('nav.settings')).toBe('Einstellungen');
    expect(t('nav.controls')).toBe('Steuerung');
  });

  it('falls back to English when a key is missing in the chosen language', () => {
    setLanguage('de');
    // app.vendor is intentionally only defined in en.json
    expect(t('app.vendor')).toBe('neoOMSI Project');
  });

  it('returns key as-is when missing in all languages', () => {
    expect(t('nonexistent.nested.key')).toBe('nonexistent.nested.key');
  });

  it('normalizes regional language tags and defaults to en on unknown', () => {
    expect(normalizeLanguage('de-DE')).toBe('de');
    expect(normalizeLanguage('de-AT')).toBe('de');
    expect(normalizeLanguage('de_CH')).toBe('de');
    expect(normalizeLanguage('en-US')).toBe('en');
    expect(normalizeLanguage('fr-FR')).toBe('en');
    expect(normalizeLanguage('es')).toBe('en');
    expect(normalizeLanguage('')).toBe('en');
    expect(normalizeLanguage(null)).toBe('en');
    expect(normalizeLanguage(undefined)).toBe('en');
  });

  it('normalizes language codes when passed to setLanguage()', () => {
    setLanguage('de-DE');
    expect(getLanguage()).toBe('de');
    expect(t('nav.drive')).toBe('Fahren');

    setLanguage('de-AT');
    expect(getLanguage()).toBe('de');

    setLanguage('fr');
    expect(getLanguage()).toBe('en');
    expect(t('nav.drive')).toBe('Drive');
  });

  it('interpolates {name} style parameters correctly', () => {
    setLanguage('en');
    const result = t('rail.level', { level: 5 });
    expect(result).toBe('Level 5');

    setLanguage('de');
    const deResult = t('rail.level', { level: 7 });
    expect(deResult).toBe('Stufe 7');
  });

  it('interpolates stand-alone strings directly with interpolate helper', () => {
    expect(interpolate('Speed: {kmh} km/h', { kmh: 50 })).toBe('Speed: 50 km/h');
    expect(interpolate('Hello {user}!', {})).toBe('Hello {user}!');
  });
});
