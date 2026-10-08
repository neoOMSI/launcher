// Keep in sync with crates/config/src/default_settings.rs.
export const DEFAULT_SETTINGS_FIXTURE = {
  gameplay: {
    boarding: 'auto',
    pax_prefer_seats: false,
    pax_rear_entry: true,
    exact_fare: true,
    driver: true,
    maintenance: 0,
    collision_vehicles: true,
    collision_objects: true,
    collision_pedestrians: true,
    hands_in_cab: false,
    time_speed: 1.0,
    time_sync: false,
    metar_sync: false,
    metar_station: '',
    auto_clutch: true,
    momentary_gears: false,
    auto_ibis: false,
    auto_shift: false,
  },
  controls: {
    steering_linear: false,
    old_steering: false,
    red_steer_spd: false,
    mouse_sens: 1.0,
    stick_sens: 0.25,
    steer_center: true,
    brake_hold: true,
    mouse_steering: false,
    mouse_right_off: false,
    blinker_cancel: true,
    wheel_range: 900.0,
    wheel_lock: 0.0,
    pedal_throttle: 1.0,
    pedal_brake: 1.0,
  },
  ai: {
    unsched_factor: 1.0,
    max_scheduled: 0,
    max_parked: 0,
  },
  ui: {
    navigator: true,
    opacity: 0.85,
    navigator_corner: 'bottom-left',
    scale: 1.0,
    scale_window: true,
    notes: true,
    show_fps: false,
    chat: true,
    tooltips: true,
    name_tags: true,
    language: 'ENG',
    units: 'metric',
  },
  navigator: {
    arrows: false,
    ai: true,
    topbar: true,
    turn: true,
    stoplist: true,
    stops_ext: false,
  },
  passengers: {
    voices: 'all',
    models: 'omsi',
    motion: 'natural',
    ik: true,
    density: 1.0,
  },
  discord: {
    status: true,
    app_id: '',
  },
  graphics: {
    graphics: 'vanilla_plus',
    graphics_api: 'auto',
    window_mode: 'windowed',
    vsync: true,
    max_fps: 0,
    msaa: 4,
    anisotropy: 8,
    post_aa: 'fxaa',
    render_scale: 0.0,
    ssao: true,
    shadows: true,
    shadow_size: 2048,
    shadow_blobs: true,
    shadow_casters: 'all',
    detail_textures: true,
    reflections: true,
    clouds: true,
    texture_compression: true,
    texture_memory: 0,
    min_obj_size: 0.013,
    max_obj_dist: -1.0,
    map_detail: -1,
    view_distance: 0.0,
    mirror_size: 256,
    mirror_refresh: 'full',
    led_glow: 6,
    nightmap_glow: 6,
    atmosphere_brightness: 1.0,
    led_mips: 1.3,
  },
  audio: {
    'master-volume': 1.0,
    'ai-volume': 1.0,
    'scenery-volume': 1.0,
    doppler: true,
  },
  controller: {
    deadzone: 0.05,
    ff_enabled: true,
    ff_invert: false,
    assign: '',
  },
  camera: {
    fov: 0.0,
    collision: true,
    smooth: true,
    head_movement: true,
    steer_look: false,
    steer_look_angle: 30.0,
    steer_look_response: 0.25,
    seat_x: 0.0,
    seat_y: 0.0,
    seat_z: 0.0,
    look_sens: 1.0,
    alt_view: true,
    free_look: false,
    crosshair: true,
    head_tracking: false,
    head_tracking_port: 4242,
    head_tracking_invert: '',
  },
  vr: {
    enabled: false,
    scale: 0.65,
    'head-smoothing-ms': 0.0,
    'mirror-rate': 16.0,
    'desktop-mirror': true,
  },
  launcher: {
    update_check: true,
    update_auto: false,
  },
};

type Value = string | number | boolean;

type Kind =
  | { kind: 'bool' }
  | { kind: 'int' | 'float' | 'floatText'; lo: number; hi: number }
  | { kind: 'auto'; off: number }
  | { kind: 'percent' | 'mirror' | 'text' | 'language' | 'graphics' | 'station' }
  | { kind: 'choice'; options: readonly string[] };

const bool: Kind = { kind: 'bool' };
const text: Kind = { kind: 'text' };
const int = (lo: number, hi = Number.MAX_SAFE_INTEGER): Kind => ({ kind: 'int', lo, hi });
const float = (lo: number, hi = Number.MAX_VALUE): Kind => ({ kind: 'float', lo, hi });
const auto = (off: number): Kind => ({ kind: 'auto', off });
const choice = (...options: string[]): Kind => ({ kind: 'choice', options });

// Keep in sync with `SETTINGS` in crates/legacy-launcher-core/src/lib.rs.
export const PAGE_SETTINGS: readonly (readonly [string, string, string, Kind])[] = [
  ['msaa', 'graphics', 'msaa', int(0, 16)],
  ['anisotropy', 'graphics', 'anisotropy', int(1, 16)],
  ['ssao', 'graphics', 'ssao', bool],
  ['shadows', 'graphics', 'shadows', bool],
  ['shadow_size', 'graphics', 'shadow_size', int(0)],
  ['detail_textures', 'graphics', 'detail_textures', bool],
  ['window_mode', 'graphics', 'window_mode', choice('windowed', 'borderless', 'fullscreen')],
  ['vsync', 'graphics', 'vsync', bool],
  ['texture_memory', 'graphics', 'texture_memory', int(0)],
  ['texture_compression', 'graphics', 'texture_compression', bool],
  ['clouds', 'graphics', 'clouds', bool],
  ['mirror_size', 'graphics', 'mirror_size', { kind: 'mirror' }],
  ['mirror_refresh', 'graphics', 'mirror_refresh', choice('full', 'eco', 'off')],
  ['max_fps', 'graphics', 'max_fps', int(0)],
  ['min_obj_size', 'graphics', 'min_obj_size', float(0)],
  ['max_obj_dist', 'graphics', 'max_obj_dist', auto(-1)],
  ['view_distance', 'graphics', 'view_distance', auto(0)],
  ['render_scale', 'graphics', 'render_scale', auto(0)],
  ['shadow_casters', 'graphics', 'shadow_casters', choice('all', 'omsi')],
  ['shadow_blobs', 'graphics', 'shadow_blobs', bool],
  ['reflections', 'graphics', 'reflections', bool],
  ['graphics_api', 'graphics', 'graphics_api', choice('auto', 'vulkan', 'dx12')],
  ['graphics', 'graphics', 'graphics', { kind: 'graphics' }],
  ['led_glow', 'graphics', 'led_glow', int(0, 15)],
  ['nightmap_glow', 'graphics', 'nightmap_glow', int(0, 15)],
  ['led_mips', 'graphics', 'led_mips', float(0, 4)],
  ['atmosphere_brightness', 'graphics', 'atmosphere_brightness', float(0, 2)],
  ['map_detail', 'graphics', 'map_detail', int(-1, 255)],
  ['navigator', 'ui', 'navigator', bool],
  ['ui_opacity', 'ui', 'opacity', float(0, 1)],
  ['navigator_corner', 'ui', 'navigator_corner', text],
  ['ui_scale', 'ui', 'scale', float(0.5, 2)],
  ['ui_scale_window', 'ui', 'scale_window', bool],
  ['notes', 'ui', 'notes', bool],
  ['show_fps', 'ui', 'show_fps', bool],
  ['chat', 'ui', 'chat', bool],
  ['tooltips', 'ui', 'tooltips', bool],
  ['name_tags', 'ui', 'name_tags', bool],
  ['language', 'ui', 'language', { kind: 'language' }],
  ['units', 'ui', 'units', choice('metric', 'uk', 'imperial')],
  ['boarding', 'gameplay', 'boarding', text],
  ['pax_prefer_seats', 'gameplay', 'pax_prefer_seats', bool],
  ['pax_rear_entry', 'gameplay', 'pax_rear_entry', bool],
  ['exact_fare', 'gameplay', 'exact_fare', bool],
  ['driver', 'gameplay', 'driver', bool],
  ['maintenance', 'gameplay', 'maintenance', int(0, 4)],
  ['collision_vehicles', 'gameplay', 'collision_vehicles', bool],
  ['collision_objects', 'gameplay', 'collision_objects', bool],
  ['collision_pedestrians', 'gameplay', 'collision_pedestrians', bool],
  ['hands_in_cab', 'gameplay', 'hands_in_cab', bool],
  ['time_speed', 'gameplay', 'time_speed', { kind: 'floatText', lo: 1, hi: 30 }],
  ['time_sync', 'gameplay', 'time_sync', bool],
  ['metar_sync', 'gameplay', 'metar_sync', bool],
  ['metar_station', 'gameplay', 'metar_station', { kind: 'station' }],
  ['auto_clutch', 'gameplay', 'auto_clutch', bool],
  ['auto_ibis', 'gameplay', 'auto_ibis', bool],
  ['momentary_gears', 'gameplay', 'momentary_gears', bool],
  ['auto_shift', 'gameplay', 'auto_shift', bool],
  ['steering_linear', 'controls', 'steering_linear', bool],
  ['old_steering', 'controls', 'old_steering', bool],
  ['red_steer_spd', 'controls', 'red_steer_spd', bool],
  ['mouse_sens', 'controls', 'mouse_sens', float(0.1, 3)],
  ['stick_sens', 'controls', 'stick_sens', float(0.1, 2)],
  ['steer_center', 'controls', 'steer_center', bool],
  ['brake_hold', 'controls', 'brake_hold', bool],
  ['mouse_steering', 'controls', 'mouse_steering', bool],
  ['mouse_right_off', 'controls', 'mouse_right_off', bool],
  ['blinker_cancel', 'controls', 'blinker_cancel', bool],
  ['wheel_range', 'controls', 'wheel_range', float(90, 2880)],
  ['wheel_lock', 'controls', 'wheel_lock', float(0, 2880)],
  ['pedal_throttle', 'controls', 'pedal_throttle', float(0.25, 4)],
  ['pedal_brake', 'controls', 'pedal_brake', float(0.25, 4)],
  ['ai_unsched_factor', 'ai', 'unsched_factor', { kind: 'percent' }],
  ['ai_max_scheduled', 'ai', 'max_scheduled', int(0)],
  ['ai_max_parked', 'ai', 'max_parked', int(-1)],
  ['nav_arrows', 'navigator', 'arrows', bool],
  ['nav_ai', 'navigator', 'ai', bool],
  ['nav_topbar', 'navigator', 'topbar', bool],
  ['nav_turn', 'navigator', 'turn', bool],
  ['nav_stoplist', 'navigator', 'stoplist', bool],
  ['nav_stops_ext', 'navigator', 'stops_ext', bool],
  ['pax_voices', 'passengers', 'voices', choice('all', 'tickets', 'off')],
  ['pax_models', 'passengers', 'models', choice('omsi', 'realistic')],
  ['pax_motion', 'passengers', 'motion', choice('natural', 'omsi')],
  ['pax_ik', 'passengers', 'ik', bool],
  ['pax_density', 'passengers', 'density', float(0, 5)],
  ['discord_status', 'discord', 'status', bool],
  ['discord_app_id', 'discord', 'app_id', text],
  ['volume', 'audio', 'master-volume', float(0, 1)],
  ['vol_ai', 'audio', 'ai-volume', float(0, 1)],
  ['vol_scenery', 'audio', 'scenery-volume', float(0, 1)],
  ['doppler', 'audio', 'doppler', bool],
  ['ff_enabled', 'controller', 'ff_enabled', bool],
  ['ff_invert', 'controller', 'ff_invert', bool],
  ['ctrl_assign', 'controller', 'assign', text],
  ['fov', 'camera', 'fov', float(0, 120)],
  ['camera_collision', 'camera', 'collision', bool],
  ['driverview_smooth', 'camera', 'smooth', bool],
  ['head_movement', 'camera', 'head_movement', bool],
  ['steer_look', 'camera', 'steer_look', bool],
  ['steer_look_angle', 'camera', 'steer_look_angle', float(0, 60)],
  ['steer_look_response', 'camera', 'steer_look_response', float(0.05, 1)],
  ['seat_x', 'camera', 'seat_x', float(-1.5, 1.5)],
  ['seat_y', 'camera', 'seat_y', float(-1.5, 1.5)],
  ['seat_z', 'camera', 'seat_z', float(-1.5, 1.5)],
  ['look_sens', 'camera', 'look_sens', float(0.1, 2)],
  ['alt_view', 'camera', 'alt_view', bool],
  ['free_look', 'camera', 'free_look', bool],
  ['crosshair', 'camera', 'crosshair', bool],
  ['head_tracking', 'camera', 'head_tracking', bool],
  ['vr', 'vr', 'enabled', bool],
  ['vr_scale', 'vr', 'scale', float(0.5, 1)],
  ['vr_head_smoothing_ms', 'vr', 'head-smoothing-ms', float(0, 30)],
  ['vr_mirror_rate', 'vr', 'mirror-rate', float(-1, 360)],
  ['vr_desktop_mirror', 'vr', 'desktop-mirror', bool],
  ['update_check', 'launcher', 'update_check', bool],
  ['update_auto', 'launcher', 'update_auto', bool],
];

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

function graphicsMode(v: string): string {
  const s = v.trim().toLowerCase().replace(/[- ]/g, '_');
  if (s === 'enhanced' || s === '1') return 'enhanced';
  if (['vanilla', 'classic', 'original', 'omsi', 'omsi2', 'omsi_2'].includes(s)) return 'vanilla';
  return 'vanilla_plus';
}

function toPage(kind: Kind, v: Value): Value {
  switch (kind.kind) {
    case 'bool':
      return Boolean(v);
    case 'int':
      return clamp(Math.trunc(Number(v)), kind.lo, kind.hi);
    case 'float':
      return clamp(Number(v), kind.lo, kind.hi);
    case 'floatText':
      return String(clamp(Number(v), kind.lo, kind.hi));
    case 'auto':
      return Number(v) <= kind.off ? 'auto' : String(Number(v));
    case 'percent':
      return clamp(Math.round(Number(v) * 100), 0, 300);
    case 'mirror':
      return Number(v) === 0 ? 0 : clamp(Math.trunc(Number(v)), 64, 2048);
    case 'choice': {
      const s = String(v).trim().toLowerCase();
      return kind.options.includes(s) ? s : kind.options[0];
    }
    case 'language':
      return /^(de|ger|german|deutsch)$/i.test(String(v).trim()) ? 'de' : 'en';
    case 'graphics':
      return graphicsMode(String(v));
    case 'station':
      return String(v)
        .replace(/[^a-z]/gi, '')
        .slice(0, 4)
        .toUpperCase();
    case 'text':
      return String(v);
  }
}

export function pageDefaults(): Record<string, Value> {
  const nested = DEFAULT_SETTINGS_FIXTURE as Record<string, Record<string, Value>>;
  const page: Record<string, Value> = {};
  for (const [key, cat, name, kind] of PAGE_SETTINGS) {
    const v = nested[cat]?.[name];
    if (v !== undefined) page[key] = toPage(kind, v);
  }
  page.enhanced = page.graphics === 'enhanced';
  return page;
}
