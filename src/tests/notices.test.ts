import { describe, expect, it } from 'vitest';
import { blocks, changes } from '../components/Changelog';
import { paxNotice } from '../pages/drive/Promo';
import { create, type MessageInitShape } from '@bufbuild/protobuf';
import { PaxPackSchema, PaxReleaseSchema, PaxState } from '../types/launcher';

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

const pack = (
  state: PaxState,
  latest: MessageInitShape<typeof PaxReleaseSchema> | null = { version: 2n },
) => create(PaxPackSchema, { state, latest: latest ?? undefined });

describe('the passenger card', () => {
  it('advertises the passengers until they are on or the advert is hidden', () => {
    expect(paxNotice(false, undefined, false, null)).toBe('promo');
    expect(paxNotice(false, undefined, true, null)).toBeNull();
  });

  it('follows the pack once they are on', () => {
    expect(paxNotice(true, pack(PaxState.MISSING), false, null)).toBe('missing');
    expect(paxNotice(true, pack(PaxState.FAILED), false, null)).toBe('missing');
    expect(paxNotice(true, pack(PaxState.DOWNLOADING), false, null)).toBe('busy');
    expect(paxNotice(true, pack(PaxState.INSTALLED), false, null)).toBeNull();
  });

  it('announces each new pack release once', () => {
    expect(paxNotice(true, pack(PaxState.OUTDATED), false, null)).toBe('update');
    expect(paxNotice(true, pack(PaxState.OUTDATED), false, '2')).toBeNull();
    const v3 = pack(PaxState.OUTDATED, { version: 3n });
    expect(paxNotice(true, v3, false, '2')).toBe('update');
  });

  it('keeps an outdated pack in view when its newest release is unknown', () => {
    const unknown = pack(PaxState.OUTDATED, null);
    expect(paxNotice(true, unknown, false, null)).toBe('update');
    expect(paxNotice(true, unknown, false, '2')).toBe('update');
    expect(paxNotice(true, unknown, false, '')).toBe('update');
  });
});
