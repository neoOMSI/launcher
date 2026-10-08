import type { SupportedLanguage } from '../../i18n';

type Names = Record<string, [en: string, de: string]>;

const KNOWN: Names = {
  throttle: ['Throttle', 'Gas'],
  brake: ['Brake', 'Bremse'],
  throttle_amplify: ['Throttle (full, kickdown)', 'Gas (voll, Kickdown)'],
  clutch: ['Clutch', 'Kupplung'],
  steering_left: ['Steer left', 'Links lenken'],
  steering_right: ['Steer right', 'Rechts lenken'],
  steering_neutral: ['Steering to centre', 'Lenkung zur Mitte'],
  parking_brake_toggle: ['Parking brake', 'Feststellbremse'],
  parking_brake_set: ['Parking brake on', 'Feststellbremse anziehen'],
  parking_brake_release: ['Parking brake off', 'Feststellbremse lösen'],
  blinker_left_set: ['Indicator left', 'Blinker links'],
  blinker_right_set: ['Indicator right', 'Blinker rechts'],
  blinker_left_toggle: ['Indicator left (toggle)', 'Blinker links (ein/aus)'],
  blinker_right_toggle: ['Indicator right (toggle)', 'Blinker rechts (ein/aus)'],
  blinker_left_move: ['Indicator left (via off)', 'Blinker links (über Aus)'],
  blinker_right_move: ['Indicator right (via off)', 'Blinker rechts (über Aus)'],
  blinker_off: ['Indicators off', 'Blinker aus'],
  blinker_warn_toggle: ['Hazard lights', 'Warnblinker'],
  horn: ['Horn', 'Hupe'],
  kw_scheinwerfer_toggle: ['Headlights', 'Scheinwerfer'],
  kw_standlicht_toggle: ['Sidelights', 'Standlicht'],
  kw_fernlicht_toggle: ['High beam', 'Fernlicht'],
  kw_m_enginestart: ['Starter', 'Anlasser'],
  kw_m_engineshutdown: ['Engine off', 'Motor abstellen'],
  kw_wipermode_up: ['Wipers (next mode)', 'Scheibenwischer (nächste Stufe)'],
  cp_batterietrennschalter_toggle: ['Battery / ignition', 'Batterie / Zündung'],
  kw_s_plus: ['Next gear (manual)', 'Gang hoch (Schaltgetriebe)'],
  kw_s_minus: ['Previous gear (manual)', 'Gang runter (Schaltgetriebe)'],
  gear_up: ['Gear up', 'Hochschalten'],
  gear_down: ['Gear down', 'Runterschalten'],
  bus_doorfront0: ['Front door (leaf 1)', 'Vordertür (Flügel 1)'],
  bus_doorfront1: ['Front door (leaf 2)', 'Vordertür (Flügel 2)'],
  bus_dooraft: ['Release rear doors', 'Hintere Türen freigeben'],
  'bus_20h-switch': ['Stop brake only (20h switch)', 'Nur Haltestellenbremse (20h-Schalter)'],
  door_haltewunsch: ['Stop request button', 'Haltewunschtaster'],
  door_kinderwagenwunsch: ['Buggy request button', 'Kinderwagentaster'],
  cp_schalter_kinderwagen: ['Buggy switch (rear door)', 'Kinderwagenschalter (Hintertür)'],
  ticket_give: ['Sell the requested ticket', 'Gewünschten Fahrschein verkaufen'],
  change_give: ['Give the change', 'Wechselgeld geben'],
  change_take: ['Take the money', 'Geld annehmen'],
  cp_microphone: ['Microphone (announcements)', 'Mikrofon (Durchsagen)'],
  cp_fahrerlicht_toggle: ["Driver's light", 'Fahrerlicht'],
  cp_licht_unterdeck_toggle: ['Cabin light, lower deck', 'Innenlicht Unterdeck'],
  cp_licht_oberdeck_toggle: ['Cabin light, upper deck', 'Innenlicht Oberdeck'],
  cp_licht_untenrechts_toggle: ['Cabin light, front right', 'Innenlicht vorne rechts'],
  cp_wischer_intervall_toggle: ['Wipers, intermittent', 'Scheibenwischer Intervall'],
  cp_wischer_schnell_toggle: ['Wipers, fast', 'Scheibenwischer schnell'],
  cp_wischer_wascher_button: ['Windscreen washer', 'Scheibenwaschanlage'],
  taster_nebelschluss: ['Rear fog light', 'Nebelschlussleuchte'],
  taster_standheizung: ['Parking heater', 'Standheizung'],
  cp_retarder_toggle: ['Retarder', 'Retarder'],
  cp_retarder_direkt_toggle: ['Retarder, direct mode', 'Retarder Direktmodus'],
  cp_motorkuehlung_toggle: ['Engine cooling', 'Motorkühlung'],
  cp_heizluefter_toggle: ['Heater fan', 'Heizungslüfter'],
  cp_schalter_ASR_off_toggle: ['Traction control (ASR)', 'Antriebsschlupfregelung (ASR)'],
  cp_rollo_retract: ['Release the sun blind', 'Rollo lösen'],
  cp_lenkrad_toggle: ['Show / hide the steering wheel', 'Lenkrad ein-/ausblenden'],
  KR_play: ['Cassette recorder: play', 'Kassettenrekorder: Wiedergabe'],
  KR_stop: ['Cassette recorder: stop', 'Kassettenrekorder: Stopp'],
  bus_linie_plus: ['Line +', 'Linie +'],
  bus_linie_minus: ['Line −', 'Linie −'],
  bus_ziel_plus: ['Destination +', 'Ziel +'],
  bus_ziel_minus: ['Destination −', 'Ziel −'],
  bus_rollband_setT: ['Rollsign: destination', 'Rollband: Ziel'],
  bus_rollband_up: ['Rollsign: wind up', 'Rollband hochkurbeln'],
  bus_rollband_dn: ['Rollsign: wind down', 'Rollband runterkurbeln'],
  bus_rollband_up_step: ['Rollsign: next position', 'Rollband: nächste Stellung'],
  bus_rollband_dn_step: ['Rollsign: previous position', 'Rollband: vorige Stellung'],
  IBIS_eingabe: ['IBIS: Enter', 'IBIS: Eingabe'],
  IBIS_loeschen: ['IBIS: Delete', 'IBIS: Löschen'],
  IBIS_setmode_linie_kurs: ['IBIS: Line / tour', 'IBIS: Linie / Kurs'],
  IBIS_setmode_route: ['IBIS: Route', 'IBIS: Route'],
  IBIS_setmode_ziel: ['IBIS: Destination', 'IBIS: Ziel'],
  IBIS_vor: ['IBIS: Next stop', 'IBIS: Nächste Haltestelle'],
  IBIS_vor_stumm: ['IBIS: Next stop (silent)', 'IBIS: Nächste Haltestelle (stumm)'],
  IBIS_rueck: ['IBIS: Previous stop', 'IBIS: Vorige Haltestelle'],
  ticketprinter_button_enter: ['Ticket printer: Enter', 'Fahrscheindrucker: Eingabe'],
  ticketprinter_button_cancel: ['Ticket printer: Cancel', 'Fahrscheindrucker: Abbruch'],
  view_set_driver: ["Driver's view", 'Fahrersicht'],
  view_set_passenger: ['Passenger view', 'Fahrgastsicht'],
  view_set_outside: ['Outside view', 'Außenansicht'],
  view_set_map: ['Free camera', 'Freie Kamera'],
  view_set_ego: ['On foot', 'Zu Fuß'],
  view_set_schedule: ['Timetable', 'Fahrplan'],
  view_set_ticketselling: ['Cash desk', 'Zahltisch'],
  view_toggle_viewpoint: ['Next view', 'Nächste Ansicht'],
  view_reset_direction: ['Look ahead again', 'Blick nach vorn'],
  view_reset_all_directions: ['Reset all views', 'Alle Ansichten zurücksetzen'],
  view_interiorcam_plus: ['Next cab camera', 'Nächste Innenkamera'],
  view_interiorcam_minus: ['Previous cab camera', 'Vorige Innenkamera'],
  view_toggle_informationdisplay: ['Information line', 'Infozeile'],
  view_look_left: ['Look left', 'Nach links schauen'],
  view_look_right: ['Look right', 'Nach rechts schauen'],
  view_look_up: ['Look up', 'Nach oben schauen'],
  view_look_down: ['Look down', 'Nach unten schauen'],
  ego_forward: ['Walk forward', 'Vorwärts gehen'],
  vr_recenter: ['VR: Reset view', 'VR: Ansicht zurücksetzen'],
  vr_toggle_desktop_mirror: ['VR: Monitor preview', 'VR: Monitorvorschau'],
  vr_toggle_mode: ['VR: Switch VR / desktop', 'VR: VR/Desktop wechseln'],
  vr_toggle_navigator: ['VR: Toggle navigator', 'VR: Navigator ein-/ausblenden'],
  vr_position_navigator: ['VR: Position navigator', 'VR: Navigator positionieren'],
  exit: ['Quit', 'Beenden'],
  open_mainmenue: ['Main menu', 'Hauptmenü'],
  open_menue: ['Menu', 'Menü'],
  chat_open: ['Multiplayer: write in the chat', 'Multiplayer: im Chat schreiben'],
  chat_toggle: ['Multiplayer: show / hide the chat', 'Multiplayer: Chat ein-/ausblenden'],
  sim_pause: ['Pause', 'Pause'],
  screenshot: ['Screenshot', 'Screenshot'],
  quicksave: ['Quicksave', 'Schnellspeichern'],
  toggel_mouse_ctrl: ['Toggle mouse steering', 'Maussteuerung ein/aus'],
  toggel_ctrler: ['Toggle game controllers', 'Spielcontroller ein/aus'],
  debug_start_bench2: ['Benchmark (developers)', 'Benchmark (Entwickler)'],
  debug_window: ['Debug window (developers)', 'Debug-Fenster (Entwickler)'],
  debug_threadcalc: ['Without multithreading (developers)', 'Ohne Multithreading (Entwickler)'],
  scendes_grabmode: ['Editor: move', 'Editor: verschieben'],
  scendes_rotmode: ['Editor: rotate', 'Editor: drehen'],
  scendes_set_x: ['Editor: X axis only', 'Editor: nur X-Achse'],
  scendes_set_y: ['Editor: Y axis only', 'Editor: nur Y-Achse'],
  scendes_set_z: ['Editor: Z axis only', 'Editor: nur Z-Achse'],
  scendes_enter: ['Editor: confirm', 'Editor: bestätigen'],
  scendes_cancel: ['Editor: cancel', 'Editor: abbrechen'],
  scendes_new: ['Editor: new object', 'Editor: neues Objekt'],
  scendes_delete: ['Editor: delete object', 'Editor: Objekt löschen'],
  scendes_nodechange_pri: ['Editor: change node', 'Editor: Knoten wechseln'],
  scendes_rast_strg: ['Editor: snap (Ctrl)', 'Editor: einrasten (Strg)'],
  scendes_aitraffic_desel: ['Editor: clear path marks', 'Editor: Pfadmarkierungen entfernen'],
  scendes_aitraffic_deact: [
    'Editor: AI traffic off (developers)',
    'Editor: KI-Verkehr aus (Entwickler)',
  ],
};

const lower = new Map(Object.entries(KNOWN).map(([k, v]) => [k.toLowerCase(), v]));

const pick = (lang: SupportedLanguage, en: string, de: string) => (lang === 'de' ? de : en);

function pattern(a: string, lang: SupportedLanguage): string | undefined {
  let m = a.match(/^kw_s_(\w+?)_fest$/i);
  if (m) return pick(lang, `Gear ${m[1]} (H-pattern)`, `Gang ${m[1]} (H-Schaltung)`);
  m = a.match(/^kw_s_(\w+)$/i);
  if (m) {
    const g = m[1].toUpperCase();
    return pick(lang, `Gear ${g} (manual)`, `Gang ${g} (Schaltgetriebe)`);
  }
  m = a.match(/^automatic_(\w+)$/i);
  if (m) return pick(lang, `Gear ${m[1].toUpperCase()}`, `Fahrstufe ${m[1].toUpperCase()}`);
  m = a.match(/^IBIS_(\d)$/i);
  if (m) return `IBIS: ${m[1]}`;
  m = a.match(/^cashdesk_changer_(\d+)_(\d\d)$/i);
  if (m) {
    return pick(lang, `Coin changer: ${m[1]}.${m[2]}`, `Münzwechsler: ${m[1]},${m[2]}`);
  }
  m = a.match(/^ticketprinter_button_ticket_(\d+)$/i);
  if (m) {
    const n = Number(m[1]) + 1;
    return pick(lang, `Ticket printer: ticket ${n}`, `Fahrscheindrucker: Fahrschein ${n}`);
  }
  m = a.match(/^bus_rollband_setL(\d)$/i);
  if (m) return pick(lang, `Rollsign: line ${m[1]}`, `Rollband: Linie ${m[1]}`);
  return undefined;
}

const NOISE = new Set(['cp', 'kw', 'bus', 'toggle', 'mouse', 'lod', 'm']);

const WORDS: Record<string, string> = {
  tuer: 'door',
  tueren: 'doors',
  licht: 'light',
  schalter: 'switch',
  taster: 'button',
  knopf: 'button',
  heizung: 'heating',
  luefter: 'fan',
  wischer: 'wipers',
  blinker: 'indicator',
  bremse: 'brake',
  haltestellenbremse: 'stop brake',
  haltewunsch: 'stop request',
  kinderwagen: 'buggy',
  fahrer: "driver's",
  fahrgast: 'passenger',
  rollband: 'rollsign',
  ziel: 'destination',
  linie: 'line',
  kasse: 'cash desk',
  drucker: 'printer',
  fahrschein: 'ticket',
  spiegel: 'mirror',
  rampe: 'ramp',
  hupe: 'horn',
  zuendung: 'ignition',
  motor: 'engine',
  innen: 'inside',
  aussen: 'outside',
  vorne: 'front',
  hinten: 'rear',
  links: 'left',
  rechts: 'right',
  oben: 'upper',
  unten: 'lower',
  hoch: 'up',
  runter: 'down',
  ein: 'on',
  aus: 'off',
  klima: 'air conditioning',
  fenster: 'window',
  rollo: 'sun blind',
  ansage: 'announcement',
  sitz: 'seat',
  kneeling: 'kneeling',
};

const fold = (w: string) =>
  w.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');

export function humanise(trigger: string, lang: SupportedLanguage = 'en'): string {
  const words = trigger
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])|([a-zA-Z])(\d)/g, (_, a, b, c, d) => (a ? `${a} ${b}` : `${c} ${d}`))
    .split(/[\s_\-./\\]+/)
    .filter((w) => w && !NOISE.has(w.toLowerCase()))
    .map((w) => (lang === 'en' ? (WORDS[fold(w)] ?? w) : w));
  const text = words.join(' ').trim() || trigger;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function actionName(trigger: string, lang: SupportedLanguage = 'en'): string {
  const known = lower.get(trigger.toLowerCase());
  if (known) return pick(lang, ...known);
  return pattern(trigger, lang) ?? humanise(trigger, lang);
}

export const isKnownAction = (trigger: string) =>
  lower.has(trigger.toLowerCase()) || pattern(trigger, 'en') !== undefined;
