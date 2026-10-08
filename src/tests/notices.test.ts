import { describe, expect, it } from 'vitest';
import { blocks, changes } from '../components/Changelog';
import { paxNotice } from '../pages/drive/Promo';
import type { PaxPack } from '../types/launcher';

const NOTES = [
  '> **Early development build.** Expect bugs.',
  '',
  "## What's changed",
  '',
  '### Features',
  '',
  '- Typed start times ([#120](https://github.com/neoOMSI/neoOMSI/pull/120))',
  '- `menu_1_ENG.html` is read',
  '',
  '### Fixes',
  '- A fix',
  '',
  '## Downloads',
  '| Platform | Game |',
].join('\n');

describe('release notes', () => {
  it('keep only the changes of a neoOMSI release', () => {
    expect(changes(NOTES)).not.toContain('Downloads');
    expect(changes(NOTES)).not.toContain('Early development');
    expect(blocks(NOTES)).toEqual([
      { kind: 'heading', text: 'Features' },
      {
        kind: 'list',
        items: [
          'Typed start times ([#120](https://github.com/neoOMSI/neoOMSI/pull/120))',
          '`menu_1_ENG.html` is read',
        ],
      },
      { kind: 'heading', text: 'Fixes' },
      { kind: 'list', items: ['A fix'] },
    ]);
  });

  it('show other notes whole, without tables', () => {
    expect(blocks('Better faces.\n\n| a | b |\n- one')).toEqual([
      { kind: 'text', text: 'Better faces.' },
      { kind: 'list', items: ['one'] },
    ]);
  });
});

const pack = (patch: Partial<PaxPack>): PaxPack => ({
  state: 'installed',
  done: 0,
  total: 0,
  message: '',
  installed: 1,
  latest: { version: 2, notes: '', page: '', published: '' },
  ...patch,
});

describe('the passenger card', () => {
  it('advertises the passengers until they are on or the advert is hidden', () => {
    expect(paxNotice(false, undefined, false, null)).toBe('promo');
    expect(paxNotice(false, undefined, true, null)).toBeNull();
  });

  it('follows the pack once they are on', () => {
    expect(paxNotice(true, pack({ state: 'missing', installed: null }), false, null)).toBe(
      'missing',
    );
    expect(paxNotice(true, pack({ state: 'failed' }), false, null)).toBe('missing');
    expect(paxNotice(true, pack({ state: 'downloading' }), false, null)).toBe('busy');
    expect(paxNotice(true, pack({ state: 'installed' }), false, null)).toBeNull();
  });

  it('announces each new pack release once', () => {
    expect(paxNotice(true, pack({ state: 'outdated' }), false, null)).toBe('update');
    expect(paxNotice(true, pack({ state: 'outdated' }), false, '2')).toBeNull();
    const v3 = pack({
      state: 'outdated',
      latest: { version: 3, notes: '', page: '', published: '' },
    });
    expect(paxNotice(true, v3, false, '2')).toBe('update');
  });

  it('keeps an outdated pack in view when its newest release is unknown', () => {
    const unknown = pack({ state: 'outdated', latest: null });
    expect(paxNotice(true, unknown, false, null)).toBe('update');
    expect(paxNotice(true, unknown, false, '2')).toBe('update');
    expect(paxNotice(true, unknown, false, '')).toBe('update');
  });
});
