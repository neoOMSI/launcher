import type { Group } from './model';

export type Category =
  'driving' | 'gearbox' | 'doors' | 'lights' | 'ibis' | 'cab' | 'views' | 'game' | 'vr' | 'editor';

export const CATEGORIES: readonly (readonly [Category, string])[] = [
  ['driving', 'search_hands_free'],
  ['gearbox', 'joystick'],
  ['doors', 'door_sliding'],
  ['lights', 'highlight'],
  ['ibis', 'confirmation_number'],
  ['cab', 'tune'],
  ['views', 'videocam'],
  ['game', 'sports_esports'],
  ['vr', 'view_in_ar'],
  ['editor', 'edit_location_alt'],
];

export const isCategory = (s?: string): s is Category => CATEGORIES.some(([c]) => c === s);

const RULES: readonly (readonly [Category, RegExp])[] = [
  ['vr', /^vr_/],
  ['editor', /^scendes_/],
  ['views', /^(view_|ego_)/],
  ['gearbox', /^(kw_s_|automatic_|gear_)/],
  ['doors', /door|tuer|haltewunsch|kinderwagen|kneeling|20h|rampe/],
  ['lights', /blinker|licht|scheinwerfer|nebel|light|lamp/],
  ['ibis', /ibis|ticket|change_|cashdesk|rollband|linie|ziel|fahrschein|drucker|kasse/],
  [
    'driving',
    /throttle|brake|bremse|clutch|kupplung|steering|lenk|horn|hupe|engine|retarder|batterie|zuendung|asr/,
  ],
];

export function categoryOf(action: string, group: Group): Category {
  const a = action.toLowerCase();
  if (group === 'game' && !/^(vr_|scendes_|view_|ego_)/.test(a)) return 'game';
  return RULES.find(([, re]) => re.test(a))?.[0] ?? (group === 'game' ? 'game' : 'cab');
}
