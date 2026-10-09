import { pageDefaults } from '../../fixtures/settings';
import { t } from '../../i18n';
import { bytes, number } from '../../lib/format';
import type { SettingKey, Settings } from '../../types/launcher';

export type TabId =
  'graphics' | 'driving' | 'camera' | 'sound' | 'gameplay' | 'interface' | 'launcher';

export type Value = string | number | boolean;

export interface Ctx {
  s: Settings;
  windows: boolean;
}

export type Option = readonly [
  value: string | number,
  label: string,
  params?: Record<string, string | number>,
];

export type CustomId =
  | 'preset'
  | 'keys'
  | 'wheel'
  | 'seat'
  | 'vrKeys'
  | 'corner'
  | 'metarStation'
  | 'paxPack'
  | 'theme'
  | 'onLaunch'
  | 'restoreOnExit'
  | 'folder'
  | 'checkUpdates'
  | 'about';

export type Control =
  | { kind: 'toggle' }
  | {
      kind: 'slider';
      min: number;
      max: number;
      step: number;
      format: (v: number) => string;
      store?: (v: number) => number;
    }
  | {
      kind: 'select';
      options: readonly Option[] | ((ctx: Ctx) => readonly Option[]);
      fallback?: (v: Value) => string;
    }
  | { kind: 'segmented'; options: readonly Option[] }
  | { kind: 'custom'; id: CustomId; wide?: boolean; writes?: readonly SettingKey[] };

export type LauncherRowKey =
  | 'about'
  | 'check_updates'
  | 'keys'
  | 'omsi_folder'
  | 'on_launch'
  | 'pax_pack'
  | 'preset'
  | 'restore_on_exit'
  | 'seat'
  | 'theme'
  | 'vr_keys'
  | 'wheel';

export interface Row {
  key: SettingKey | LauncherRowKey;
  control: Control;
  hint?: boolean;
  visible?: (ctx: Ctx) => boolean;
}

export interface Group {
  id: string;
  rows: readonly Row[];
  description?: boolean;
  visible?: (ctx: Ctx) => boolean;
}

export interface Tab {
  id: TabId;
  icon: string;
  groups: readonly Group[];
  resettable?: boolean;
}

export const tr = (key: string, params?: Record<string, string | number>) =>
  t(`settings.${key}`, params);

export const optionLabel = ([, label, params]: Option) => tr(label, params);

const pct = (v: number) => tr('fmt.percent', { n: Math.round(v * 100) });
const omsiOrPct = (v: number) => (Math.abs(v - 1) < 0.01 ? tr('opt.omsi') : pct(v));
const deg = (v: number) => tr('fmt.degrees', { n: Math.round(v) });
const ms = (v: number) => tr('fmt.ms', { n: Math.round(v * 1000) });
const glow = (v: number) => (v < 0.5 ? tr('opt.off') : String(Math.round(v)));
const two = (v: number) => number(v, 2);
const pedal = (v: number) =>
  Math.abs(v - 1) < 0.01 ? tr('opt.normal') : tr('fmt.factor', { n: number(v, 2) });
const cm = (v: number) => {
  const n = Math.round(v * 100);
  return tr('fmt.cm', { n: n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0' });
};

const toggle = (key: SettingKey, extra: Partial<Row> = {}): Row => ({
  key,
  control: { kind: 'toggle' },
  ...extra,
});

const slider = (
  key: SettingKey,
  min: number,
  max: number,
  step: number,
  format: (v: number) => string,
  extra: Partial<Row> & { store?: (v: number) => number } = {},
): Row => {
  const { store, ...rest } = extra;
  return { key, control: { kind: 'slider', min, max, step, format, store }, ...rest };
};

const select = (key: SettingKey, options: readonly Option[], extra: Partial<Row> = {}): Row => ({
  key,
  control: { kind: 'select', options },
  ...extra,
});

const custom = (
  key: SettingKey | LauncherRowKey,
  id: CustomId,
  extra: Partial<Row> & { wide?: boolean; writes?: readonly SettingKey[] } = {},
): Row => {
  const { wide, writes, ...rest } = extra;
  return { key, control: { kind: 'custom', id, wide, writes }, ...rest };
};

const n = (label: string, values: readonly number[]): Option[] =>
  values.map((v) => [v, label, { n: v }] as const);
const ns = (label: string, values: readonly number[]): Option[] =>
  values.map((v) => [String(v), label, { n: v }] as const);

const enhancedOnly = ({ s }: Ctx) => s.graphics !== 'vanilla';
const on =
  (key: SettingKey) =>
  ({ s }: Ctx) =>
    s[key] === true;

export const PRESET_IDS = ['low', 'medium', 'high', 'ultra'] as const;
export type PresetId = (typeof PRESET_IDS)[number];

// Keep in sync with `PRESETS` in crates/core/src/game_lists/settings.rs.
export const PRESETS: Record<PresetId, Settings> = {
  low: {
    msaa: 1,
    anisotropy: 2,
    shadow_size: 1024,
    ssao: false,
    shadows: false,
    detail_textures: false,
    clouds: false,
    view_distance: '600',
    min_obj_size: 0.03,
    max_obj_dist: '500',
    mirror_size: 128,
    mirror_refresh: 'eco',
    render_scale: '0.75',
    texture_memory: 800,
  },
  medium: {
    msaa: 2,
    anisotropy: 4,
    shadow_size: 2048,
    ssao: false,
    shadows: true,
    detail_textures: true,
    clouds: true,
    view_distance: '900',
    min_obj_size: 0.02,
    max_obj_dist: '750',
    mirror_size: 256,
    mirror_refresh: 'eco',
    render_scale: 'auto',
    texture_memory: 1200,
  },
  high: {
    msaa: 4,
    anisotropy: 8,
    shadow_size: 2048,
    ssao: true,
    shadows: true,
    detail_textures: true,
    clouds: true,
    view_distance: 'auto',
    min_obj_size: 0.013,
    max_obj_dist: 'auto',
    mirror_size: 256,
    mirror_refresh: 'full',
    render_scale: 'auto',
    texture_memory: 0,
  },
  ultra: {
    msaa: 4,
    anisotropy: 8,
    shadow_size: 4096,
    ssao: true,
    shadows: true,
    detail_textures: true,
    clouds: true,
    view_distance: '2000',
    min_obj_size: 0.005,
    max_obj_dist: '1500',
    mirror_size: 512,
    mirror_refresh: 'full',
    render_scale: 'auto',
    texture_memory: 0,
  },
};

export function same(a: Value | undefined, b: Value | undefined): boolean {
  if (a === b) return true;
  if (a === undefined || b === undefined || typeof a === 'boolean' || typeof b === 'boolean')
    return false;
  const x = Number(a);
  const y = Number(b);
  return a !== '' && b !== '' && Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) < 1e-6;
}

export function presetOf(s: Settings): PresetId | 'custom' {
  return (
    PRESET_IDS.find((id) =>
      (Object.entries(PRESETS[id]) as [SettingKey, Value][]).every(([k, v]) => same(s[k], v)),
    ) ?? 'custom'
  );
}

export const TABS: readonly Tab[] = [
  {
    id: 'graphics',
    icon: 'display_settings',
    resettable: true,
    groups: [
      {
        id: 'quality',
        rows: [
          custom('preset', 'preset', { hint: true }),
          select(
            'graphics',
            [
              ['vanilla', 'opt.vanilla'],
              ['vanilla_plus', 'opt.vanillaPlus'],
              ['enhanced', 'opt.enhanced'],
            ],
            { hint: true },
          ),
        ],
      },
      {
        id: 'display',
        rows: [
          select('window_mode', [
            ['windowed', 'opt.windowed'],
            ['borderless', 'opt.borderless'],
            ['fullscreen', 'opt.fullscreen'],
          ]),
          toggle('vsync'),
          select('max_fps', [
            [0, 'opt.refreshRate'],
            ...n('fmt.fps', [30, 45, 60, 120, 144]),
            [1000, 'opt.unlimited'],
          ]),
          select('render_scale', [
            ['auto', 'opt.auto'],
            ['1', 'fmt.percent', { n: 100 }],
            ['0.85', 'fmt.percent', { n: 85 }],
            ['0.75', 'fmt.percent', { n: 75 }],
            ['0.67', 'fmt.percent', { n: 67 }],
            ['0.5', 'fmt.percent', { n: 50 }],
          ]),
          select(
            'graphics_api',
            [
              ['auto', 'opt.automatic'],
              ['vulkan', 'opt.vulkan'],
              ['dx12', 'opt.dx12'],
            ],
            { visible: ({ windows }) => windows, hint: true },
          ),
        ],
      },
      {
        id: 'sharpness',
        rows: [
          select('msaa', [[1, 'opt.off'], ...n('fmt.msaa', [2, 4, 8])]),
          select('anisotropy', [[1, 'opt.off'], ...n('fmt.times', [2, 4, 8, 16])]),
          toggle('detail_textures', { visible: enhancedOnly }),
        ],
      },
      {
        id: 'lighting',
        rows: [
          toggle('shadows', { visible: enhancedOnly }),
          select('shadow_size', n('fmt.plain', [1024, 2048, 4096]), { visible: enhancedOnly }),
          select(
            'shadow_casters',
            [
              ['all', 'opt.castersAll'],
              ['omsi', 'opt.castersOmsi'],
            ],
            { visible: enhancedOnly },
          ),
          toggle('ssao', { visible: enhancedOnly }),
          toggle('shadow_blobs', { hint: true }),
          toggle('reflections', { hint: true }),
          slider('atmosphere_brightness', 0, 2, 0.05, two, { visible: enhancedOnly }),
          toggle('clouds'),
        ],
      },
      {
        id: 'glow',
        rows: [
          slider('led_glow', 0, 15, 1, glow, { visible: enhancedOnly, hint: true }),
          slider('nightmap_glow', 0, 15, 1, glow, { visible: enhancedOnly, hint: true }),
          slider('led_mips', 0, 4, 0.05, (v) => (v < 0.005 ? tr('opt.off') : two(v)), {
            visible: enhancedOnly,
            hint: true,
          }),
        ],
      },
      {
        id: 'world',
        rows: [
          select('view_distance', [
            ['auto', 'opt.viewDefault'],
            ['600', 'opt.viewFastest'],
            ...ns('fmt.metres', [900, 1200, 1500, 2000, 2500]),
          ]),
          select(
            'max_obj_dist',
            [['auto', 'opt.automatic'], ...ns('fmt.metres', [500, 750, 900, 1500, 3000])],
            { hint: true },
          ),
          select(
            'min_obj_size',
            [
              [0.005, 'opt.all'],
              [0.013, 'opt.normal'],
              [0.02, 'opt.fewer'],
              [0.03, 'opt.few'],
            ],
            { hint: true },
          ),
          select(
            'map_detail',
            [
              [-1, 'opt.omsiSetting'],
              [0, 'opt.low'],
              [1, 'opt.normal'],
              [2, 'opt.full'],
              [255, 'opt.allLevels'],
            ],
            { hint: true },
          ),
        ],
      },
      {
        id: 'mirrors',
        rows: [
          select('mirror_size', [
            [0, 'opt.off'],
            [128, 'opt.mirrorLow'],
            [256, 'opt.mirrorNormal'],
            [512, 'opt.mirrorHigh'],
            [1024, 'opt.mirrorVeryHigh'],
          ]),
          select(
            'mirror_refresh',
            [
              ['off', 'opt.frozen'],
              ['eco', 'opt.eco'],
              ['full', 'opt.full'],
            ],
            { hint: true },
          ),
        ],
      },
      {
        id: 'memory',
        rows: [
          {
            key: 'texture_memory',
            hint: true,
            control: {
              kind: 'select',
              options: ({ s }) => {
                const auto = Number(s.texture_memory_auto) || 0;
                return [
                  auto > 0
                    ? [0, 'opt.automaticHere', { size: bytes(auto * 1e6) }]
                    : [0, 'opt.automatic'],
                  ...[500, 1000, 1500, 2000, 3000, 4000, 6000].map(
                    (mb) => [mb, 'fmt.plain', { n: bytes(mb * 1e6) }] as const,
                  ),
                ];
              },
              fallback: (v) => bytes(Number(v) * 1e6),
            },
          },
          toggle('texture_compression', { hint: true }),
        ],
      },
    ],
  },
  {
    id: 'driving',
    icon: 'directions_bus',
    resettable: true,
    groups: [
      {
        id: 'steering',
        rows: [
          slider('mouse_sens', 0.1, 3, 0.05, omsiOrPct, { hint: true }),
          slider('stick_sens', 0.1, 2, 0.05, pct),
          toggle('steering_linear', { hint: true }),
          toggle('old_steering', { hint: true }),
          toggle('red_steer_spd', { hint: true }),
          toggle('steer_center', { hint: true }),
          toggle('mouse_steering', { hint: true }),
          toggle('mouse_right_off', { hint: true }),
        ],
      },
      {
        id: 'assists',
        rows: [
          toggle('auto_clutch', { hint: true }),
          toggle('auto_shift', { hint: true }),
          toggle('momentary_gears', { hint: true }),
          toggle('brake_hold', { hint: true }),
          toggle('blinker_cancel', { hint: true }),
          toggle('auto_ibis', { hint: true }),
        ],
      },
      {
        id: 'keyboard',
        rows: [custom('keys', 'keys', { hint: true })],
      },
      {
        id: 'controllers',
        rows: [
          slider('wheel_range', 180, 1800, 30, deg, { hint: true }),
          slider('wheel_lock', 0, 1800, 30, (v) => (v < 45 ? tr('opt.omsi') : deg(v)), {
            hint: true,
            store: (v) => (v < 45 ? 0 : Math.round(v)),
          }),
          slider('pedal_throttle', 0.5, 2, 0.05, pedal, { hint: true }),
          slider('pedal_brake', 0.5, 2, 0.05, pedal),
          toggle('ff_enabled'),
          toggle('ff_invert', { hint: true }),
          custom('wheel', 'wheel', { wide: true }),
        ],
      },
    ],
  },
  {
    id: 'camera',
    icon: 'videocam',
    resettable: true,
    groups: [
      {
        id: 'seat',
        rows: [
          slider('seat_y', -0.6, 0.6, 0.01, cm),
          slider('seat_z', -0.6, 0.6, 0.01, cm),
          slider('seat_x', -0.6, 0.6, 0.01, cm),
          custom('seat', 'seat', { hint: true }),
        ],
      },
      {
        id: 'driverView',
        rows: [
          slider('fov', 0, 120, 1, (v) => (v < 20 ? tr('opt.default') : deg(v)), {
            hint: true,
            store: (v) => (v < 20 ? 0 : Math.round(v)),
          }),
          slider('look_sens', 0.1, 2, 0.05, omsiOrPct),
          toggle('steer_look', { hint: true }),
          slider('steer_look_angle', 0, 60, 1, deg, { visible: on('steer_look') }),
          slider('steer_look_response', 0.05, 1, 0.05, ms, {
            visible: on('steer_look'),
            hint: true,
          }),
          toggle('head_movement'),
          toggle('driverview_smooth'),
          toggle('hands_in_cab'),
          toggle('alt_view', { hint: true }),
          toggle('free_look', { hint: true }),
          toggle('crosshair', { hint: true }),
        ],
      },
      {
        id: 'outside',
        rows: [toggle('camera_collision', { hint: true }), toggle('driver', { hint: true })],
      },
      {
        id: 'headTracking',
        rows: [toggle('head_tracking', { hint: true })],
      },
      {
        id: 'vr',
        visible: ({ windows }) => windows,
        rows: [
          toggle('vr', { hint: true }),
          select(
            'vr_scale',
            [
              [0.5, 'fmt.percent', { n: 50 }],
              [0.65, 'fmt.percent', { n: 65 }],
              [0.8, 'fmt.percent', { n: 80 }],
              [1, 'fmt.percent', { n: 100 }],
            ],
            { visible: on('vr') },
          ),
          select('vr_head_smoothing_ms', [[0, 'opt.off'], ...n('fmt.ms', [5, 10, 20, 30])], {
            visible: on('vr'),
          }),
          select(
            'vr_mirror_rate',
            [
              [0, 'opt.off'],
              ...n('fmt.perSecond', [8, 16, 24, 32, 48, 60, 90, 120, 180, 240, 360]),
              [-1, 'opt.everyFrame'],
            ],
            { visible: on('vr'), hint: true },
          ),
          toggle('vr_desktop_mirror', { visible: on('vr') }),
          custom('vr_keys', 'vrKeys', { visible: on('vr') }),
        ],
      },
    ],
  },
  {
    id: 'sound',
    icon: 'volume_up',
    resettable: true,
    groups: [
      {
        id: 'volume',
        rows: [
          slider('volume', 0, 1, 0.05, pct),
          slider('vol_ai', 0, 1, 0.05, pct, { hint: true }),
          slider('vol_scenery', 0, 1, 0.05, pct, { hint: true }),
        ],
      },
      {
        id: 'voices',
        rows: [
          toggle('doppler', { hint: true }),
          select('pax_voices', [
            ['all', 'opt.voicesAll'],
            ['tickets', 'opt.voicesTickets'],
            ['off', 'opt.silent'],
          ]),
        ],
      },
    ],
  },
  {
    id: 'gameplay',
    icon: 'tune',
    resettable: true,
    groups: [
      {
        id: 'passengers',
        rows: [
          select(
            'boarding',
            [
              ['auto', 'opt.boardAuto'],
              ['pay', 'opt.boardPay'],
              ['walk', 'opt.boardWalk'],
            ],
            { hint: true },
          ),
          toggle('exact_fare'),
          toggle('pax_prefer_seats', { hint: true }),
          toggle('pax_rear_entry', { hint: true }),
          slider('pax_density', 0, 2, 0.1, pct),
        ],
      },
      {
        id: 'paxModels',
        rows: [
          {
            key: 'pax_models',
            hint: true,
            control: {
              kind: 'segmented',
              options: [
                ['omsi', 'opt.omsi2'],
                ['realistic', 'opt.realistic'],
              ],
            },
          },
          custom('pax_pack', 'paxPack', { visible: ({ s }) => s.pax_models === 'realistic' }),
          {
            key: 'pax_motion',
            control: {
              kind: 'segmented',
              options: [
                ['natural', 'opt.natural'],
                ['omsi', 'opt.omsi2'],
              ],
            },
          },
          toggle('pax_ik', { hint: true }),
        ],
      },
      {
        id: 'traffic',
        rows: [
          select('ai_unsched_factor', n('fmt.percent', [25, 50, 75, 100, 150, 200]), {
            hint: true,
          }),
          select('ai_max_scheduled', [[0, 'opt.all'], ...n('fmt.atMost', [10, 25, 50])], {
            hint: true,
          }),
          select('ai_max_parked', [
            [-1, 'opt.none'],
            [0, 'opt.everySpace'],
            ...n('fmt.atMost', [35, 100, 250]),
          ]),
        ],
      },
      {
        id: 'simulation',
        rows: [
          select(
            'maintenance',
            [
              [0, 'opt.infinite'],
              [1, 'opt.veryBad'],
              [2, 'opt.bad'],
              [3, 'opt.normal'],
              [4, 'opt.good'],
            ],
            { hint: true },
          ),
          toggle('collision_vehicles'),
          toggle('collision_objects', { hint: true }),
          toggle('collision_pedestrians'),
        ],
      },
      {
        id: 'timeWeather',
        rows: [
          toggle('time_sync', { hint: true }),
          toggle('metar_sync', { hint: true }),
          custom('metar_station', 'metarStation', {
            visible: on('metar_sync'),
            hint: true,
            writes: ['metar_station'],
          }),
          select('time_speed', [[1, 'opt.realTime'], ...n('fmt.speed', [2, 4, 8, 15, 30])], {
            hint: true,
          }),
        ],
      },
    ],
  },
  {
    id: 'interface',
    icon: 'dashboard',
    resettable: true,
    groups: [
      {
        id: 'language',
        rows: [
          select('language', [
            ['en', 'lang.en'],
            ['de', 'lang.de'],
          ]),
          select('units', [
            ['metric', 'opt.metric'],
            ['uk', 'opt.uk'],
            ['imperial', 'opt.imperial'],
          ]),
        ],
      },
      {
        id: 'hud',
        description: true,
        rows: [
          slider('ui_scale', 0.5, 2, 0.05, pct, { hint: true }),
          toggle('ui_scale_window', { hint: true }),
          slider('ui_opacity', 0.2, 1, 0.05, pct, { hint: true }),
          toggle('tooltips'),
          toggle('show_fps'),
          toggle('notes'),
        ],
      },
      {
        id: 'online',
        rows: [toggle('discord_status', { hint: true }), toggle('chat'), toggle('name_tags')],
      },
      {
        id: 'navigator',
        rows: [
          toggle('navigator', { hint: true }),
          toggle('nav_arrows', { visible: on('navigator') }),
          toggle('nav_ai', { visible: on('navigator') }),
          toggle('nav_topbar', { visible: on('navigator'), hint: true }),
          toggle('nav_turn', { visible: on('navigator'), hint: true }),
          toggle('nav_stoplist', { visible: on('navigator'), hint: true }),
          toggle('nav_stops_ext', {
            visible: ({ s }) => s.navigator === true && s.nav_stoplist === true,
            hint: true,
          }),
          custom('navigator_corner', 'corner', {
            visible: on('navigator'),
            writes: ['navigator_corner'],
          }),
        ],
      },
    ],
  },
  {
    id: 'launcher',
    icon: 'rocket_launch',
    resettable: true,
    groups: [
      { id: 'appearance', rows: [custom('theme', 'theme')] },
      {
        id: 'gameStart',
        rows: [
          custom('on_launch', 'onLaunch'),
          custom('restore_on_exit', 'restoreOnExit', { hint: true }),
        ],
      },
      {
        id: 'folder',
        description: true,
        rows: [custom('omsi_folder', 'folder', { wide: true })],
      },
      {
        id: 'updates',
        rows: [
          toggle('update_check'),
          toggle('update_auto'),
          custom('check_updates', 'checkUpdates', { wide: true }),
        ],
      },
      { id: 'about', rows: [custom('about', 'about', { wide: true })] },
    ],
  },
];

export const TAB_IDS = TABS.map((tab) => tab.id);

export const isTab = (id: string | undefined): id is TabId =>
  id !== undefined && (TAB_IDS as string[]).includes(id);

export const optionsOf = (control: Extract<Control, { kind: 'select' }>, ctx: Ctx) =>
  typeof control.options === 'function' ? control.options(ctx) : control.options;

export function settingKeys(tab: Tab): SettingKey[] {
  return tab.groups.flatMap((g) =>
    g.rows.flatMap((r) =>
      r.control.kind === 'custom' ? [...(r.control.writes ?? [])] : [r.key as SettingKey],
    ),
  );
}

export const DEFAULTS: Readonly<Settings> = pageDefaults();

export function resetPatch(tab: Tab): Settings {
  const patch: Settings = {};
  for (const key of settingKeys(tab)) {
    if (key !== 'language' && key in DEFAULTS) patch[key] = DEFAULTS[key];
  }
  return patch;
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export interface Match {
  tab: Tab;
  groups: { group: Group; rows: Row[] }[];
}

function haystack(row: Row, ctx: Ctx): string {
  const parts = [tr(`rows.${row.key}`)];
  if (row.hint) parts.push(tr(`hints.${row.key}`));
  const c = row.control;
  if (c.kind === 'select') parts.push(...optionsOf(c, ctx).map(optionLabel));
  if (c.kind === 'segmented') parts.push(...c.options.map(optionLabel));
  return fold(parts.join(' '));
}

export function search(query: string, ctx: Ctx): Match[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const matches: Match[] = [];
  for (const tab of TABS) {
    const groups = tab.groups
      .filter((g) => !g.visible || g.visible(ctx))
      .map((group) => {
        const title = fold(tr(`groups.${group.id}`));
        const rows = group.rows.filter((row) => {
          if (row.visible && !row.visible(ctx)) return false;
          const text = `${title} ${haystack(row, ctx)}`;
          return words.every((w) => text.includes(w));
        });
        return { group, rows };
      })
      .filter((g) => g.rows.length);
    if (groups.length) matches.push({ tab, groups });
  }
  return matches;
}
