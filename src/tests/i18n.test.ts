import { describe, it, expect, beforeEach } from 'vitest';
import { translate, setLanguage, getLanguage, interpolate, normalizeLanguage, t } from '../i18n';

describe('i18n', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  it('translates nested keys in English', () => {
    setLanguage('en');
    expect(t('navigation.launch')).toBe('Launch');
    expect(t('navigation.content')).toBe('Content');
    expect(t('navigation.settings')).toBe('Settings');
    expect(t('navigation.diagnostics')).toBe('Diagnostics');
  });

  it('translates nested keys in German', () => {
    setLanguage('de');
    expect(t('navigation.launch')).toBe('Start');
    expect(t('navigation.content')).toBe('Inhalte');
    expect(t('navigation.settings')).toBe('Einstellungen');
    expect(t('navigation.diagnostics')).toBe('Diagnose');
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
    expect(t('navigation.launch')).toBe('Start');

    setLanguage('de-AT');
    expect(getLanguage()).toBe('de');

    setLanguage('fr');
    expect(getLanguage()).toBe('en');
    expect(t('navigation.launch')).toBe('Launch');
  });

  it('interpolates {name} style parameters correctly', () => {
    setLanguage('en');
    const result = t('launch.activeSession', { sessionId: 'sim_123' });
    expect(result).toBe('Active Session: sim_123');

    setLanguage('de');
    const deResult = t('launch.activeSession', { sessionId: 'sim_456' });
    expect(deResult).toBe('Aktive Sitzung: sim_456');
  });

  it('interpolates stand-alone strings directly with interpolate helper', () => {
    expect(interpolate('Speed: {kmh} km/h', { kmh: 50 })).toBe('Speed: 50 km/h');
    expect(interpolate('Hello {user}!', {})).toBe('Hello {user}!');
  });
});
