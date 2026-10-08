import type { SupportedLanguage } from '../../i18n';

export const KEY_HOLD = 1;
export const KEY_SHIFT = 2;
export const KEY_CTRL = 4;
export const KEY_ALT = 8;
export const CHORD = KEY_SHIFT | KEY_CTRL | KEY_ALT;

export type LayoutMap = Pick<Map<string, string>, 'get'>;

interface KeyDef {
  code: string;
  dik: number;
  en?: string;
  de?: string;
  alias?: string;
  printable?: boolean;
}

const letters = 'QWERTYUIOP ASDFGHJKL ZXCVBNM'.split(' ');
const letterDik = [0x10, 0x1e, 0x2c];

const KEYS: KeyDef[] = [
  { code: 'Escape', dik: 0x01, en: 'Esc' },
  ...'1234567890'
    .split('')
    .map((d, i) => ({ code: `Digit${d}`, dik: 0x02 + i, en: d, printable: true })),
  { code: 'Minus', dik: 0x0c, en: '-', printable: true },
  { code: 'Equal', dik: 0x0d, en: '=', printable: true },
  { code: 'Backspace', dik: 0x0e, en: 'Backspace', de: 'Rücktaste' },
  { code: 'Tab', dik: 0x0f, en: 'Tab' },
  ...letters.flatMap((row, r) =>
    row.split('').map((c, i) => ({
      code: `Key${c}`,
      dik: letterDik[r] + i,
      en: c,
      printable: true,
    })),
  ),
  { code: 'BracketLeft', dik: 0x1a, en: '[', printable: true },
  { code: 'BracketRight', dik: 0x1b, en: ']', printable: true },
  { code: 'Enter', dik: 0x1c, en: 'Enter', de: 'Eingabe', alias: 'Return' },
  { code: 'ControlLeft', dik: 0x1d, en: 'Left Ctrl', de: 'Strg links' },
  { code: 'Semicolon', dik: 0x27, en: ';', printable: true },
  { code: 'Quote', dik: 0x28, en: "'", printable: true },
  { code: 'Backquote', dik: 0x29, en: '`', printable: true },
  { code: 'ShiftLeft', dik: 0x2a, en: 'Left Shift', de: 'Shift links' },
  { code: 'Backslash', dik: 0x2b, en: '\\', printable: true },
  { code: 'Comma', dik: 0x33, en: ',', printable: true },
  { code: 'Period', dik: 0x34, en: '.', printable: true },
  { code: 'Slash', dik: 0x35, en: '/', printable: true },
  { code: 'ShiftRight', dik: 0x36, en: 'Right Shift', de: 'Shift rechts' },
  { code: 'NumpadMultiply', dik: 0x37, en: 'Numpad *', de: 'Num *' },
  { code: 'AltLeft', dik: 0x38, en: 'Alt' },
  { code: 'Space', dik: 0x39, en: 'Space', de: 'Leertaste' },
  { code: 'CapsLock', dik: 0x3a, en: 'Caps Lock', de: 'Feststelltaste' },
  ...Array.from({ length: 10 }, (_, i) => ({ code: `F${i + 1}`, dik: 0x3b + i, en: `F${i + 1}` })),
  { code: 'NumLock', dik: 0x45, en: 'Num Lock', de: 'Num' },
  { code: 'ScrollLock', dik: 0x46, en: 'Scroll Lock', de: 'Rollen' },
  ...(
    [
      [7, 0x47],
      [8, 0x48],
      [9, 0x49],
      [4, 0x4b],
      [5, 0x4c],
      [6, 0x4d],
      [1, 0x4f],
      [2, 0x50],
      [3, 0x51],
      [0, 0x52],
    ] as const
  ).map(([n, dik]) => ({ code: `Numpad${n}`, dik, en: `Numpad ${n}`, de: `Num ${n}` })),
  { code: 'NumpadSubtract', dik: 0x4a, en: 'Numpad -', de: 'Num -' },
  { code: 'NumpadAdd', dik: 0x4e, en: 'Numpad +', de: 'Num +' },
  { code: 'NumpadDecimal', dik: 0x53, en: 'Numpad .', de: 'Num ,' },
  { code: 'IntlBackslash', dik: 0x56, en: '<', printable: true },
  { code: 'F11', dik: 0x57, en: 'F11' },
  { code: 'F12', dik: 0x58, en: 'F12' },
  ...Array.from({ length: 11 }, (_, i) => ({
    code: `F${i + 13}`,
    dik: 0x64 + i,
    en: `F${i + 13}`,
  })),
  { code: 'KanaMode', dik: 0x70, en: 'Kana' },
  { code: 'IntlRo', dik: 0x73, en: 'Ro', printable: true },
  { code: 'F24', dik: 0x76, en: 'F24' },
  { code: 'Convert', dik: 0x79, en: 'Convert' },
  { code: 'NonConvert', dik: 0x7b, en: 'No Convert' },
  { code: 'IntlYen', dik: 0x7d, en: '¥', printable: true },
  { code: 'NumpadEqual', dik: 0x8d, en: 'Numpad =', de: 'Num =' },
  { code: 'NumpadEnter', dik: 0x9c, en: 'Numpad Enter', de: 'Num Enter' },
  { code: 'ControlRight', dik: 0x9d, en: 'Right Ctrl', de: 'Strg rechts' },
  { code: 'NumpadComma', dik: 0xb3, en: 'Numpad ,', de: 'Num ,' },
  { code: 'NumpadDivide', dik: 0xb5, en: 'Numpad /', de: 'Num /' },
  { code: 'PrintScreen', dik: 0xb7, en: 'Print Screen', de: 'Druck' },
  { code: 'AltRight', dik: 0xb8, en: 'Right Alt', de: 'Alt Gr' },
  { code: 'Pause', dik: 0xc5, en: 'Pause' },
  { code: 'Home', dik: 0xc7, en: 'Home', de: 'Pos1' },
  { code: 'ArrowUp', dik: 0xc8, en: '↑', alias: 'Up Arrow Pfeil hoch oben' },
  { code: 'PageUp', dik: 0xc9, en: 'Page Up', de: 'Bild ↑', alias: 'Bild auf' },
  { code: 'ArrowLeft', dik: 0xcb, en: '←', alias: 'Left Arrow Pfeil links' },
  { code: 'ArrowRight', dik: 0xcd, en: '→', alias: 'Right Arrow Pfeil rechts' },
  { code: 'End', dik: 0xcf, en: 'End', de: 'Ende' },
  { code: 'ArrowDown', dik: 0xd0, en: '↓', alias: 'Down Arrow Pfeil runter unten' },
  { code: 'PageDown', dik: 0xd1, en: 'Page Down', de: 'Bild ↓', alias: 'Bild ab' },
  { code: 'Insert', dik: 0xd2, en: 'Insert', de: 'Einfg' },
  { code: 'Delete', dik: 0xd3, en: 'Del', de: 'Entf', alias: 'Delete' },
  { code: 'MetaLeft', dik: 0xdb, en: 'Left Win', de: 'Win links' },
  { code: 'MetaRight', dik: 0xdc, en: 'Right Win', de: 'Win rechts' },
  { code: 'ContextMenu', dik: 0xdd, en: 'Menu', de: 'Menü' },
];

const BY_CODE = new Map(KEYS.map((k) => [k.code, k]));
const BY_DIK = new Map(KEYS.map((k) => [k.dik, k]));

export const MODIFIER_CODES = new Set([
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
]);

export const dikFromCode = (code: string): number | undefined => BY_CODE.get(code)?.dik;
export const codeFromDik = (dik: number): string | undefined => BY_DIK.get(dik)?.code;
export const allCodes = () => KEYS.map((k) => k.code);

export function keyName(dik: number, lang: SupportedLanguage = 'en', layout?: LayoutMap): string {
  const key = BY_DIK.get(dik);
  if (!key) return `#${dik}`;
  if (key.printable) {
    const shown = layout?.get(key.code);
    if (shown && shown.trim()) return shown.toUpperCase();
  }
  return (lang === 'de' && key.de) || key.en || key.code;
}

export const keyAlias = (dik: number) => BY_DIK.get(dik)?.alias ?? '';

const MODIFIERS: [number, Record<SupportedLanguage, string>][] = [
  [KEY_CTRL, { en: 'Ctrl', de: 'Strg' }],
  [KEY_SHIFT, { en: 'Shift', de: 'Shift' }],
  [KEY_ALT, { en: 'Alt', de: 'Alt' }],
];

export function keyCaps(
  scan: number,
  modifier: number,
  lang: SupportedLanguage = 'en',
  layout?: LayoutMap,
): string[] {
  if (!scan) return [];
  return [
    ...MODIFIERS.filter(([bit]) => modifier & bit).map(([, name]) => name[lang]),
    keyName(scan, lang, layout),
  ];
}

export const keyLabel = (
  scan: number,
  modifier: number,
  lang: SupportedLanguage = 'en',
  layout?: LayoutMap,
) => keyCaps(scan, modifier, lang, layout).join('+');

export interface KeyLike {
  code: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

export const chordOf = (e: Omit<KeyLike, 'code'>) =>
  (e.shiftKey ? KEY_SHIFT : 0) | (e.ctrlKey ? KEY_CTRL : 0) | (e.altKey ? KEY_ALT : 0);

const OWN_BIT: Record<string, number> = {
  ShiftLeft: KEY_SHIFT,
  ShiftRight: KEY_SHIFT,
  ControlLeft: KEY_CTRL,
  ControlRight: KEY_CTRL,
  AltLeft: KEY_ALT,
  AltRight: KEY_ALT,
};

// A modifier pressed on its own binds the key itself, so its own bit must not become the chord.
export function capture(e: KeyLike, previous: number): { scan: number; modifier: number } | null {
  const scan = dikFromCode(e.code);
  if (!scan) return null;
  const chord = chordOf(e) & ~(OWN_BIT[e.code] ?? 0);
  return { scan, modifier: chord | (previous & KEY_HOLD) };
}
