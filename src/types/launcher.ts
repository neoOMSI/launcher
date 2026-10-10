import { create, ScalarType, type MessageInitShape } from '@bufbuild/protobuf';
import {
  RequestSchema,
  SettingsSchema,
  type AutoNumber,
  type Event,
  type JoinCheck as EngineJoinCheck,
  type ModsStatus as EngineModsStatus,
  type Request,
  type Response,
  type Settings as EngineSettings,
} from './launcher_pb';

export * from './launcher_pb';

type Snake<S extends string> = S extends `${infer H}${infer T}`
  ? `${H extends Lowercase<H> ? H : `_${Lowercase<H>}`}${Snake<T>}`
  : S;

export type SettingKey = Snake<Exclude<keyof EngineSettings, '$typeName' | '$unknown'>>;

/** The settings by the engine's keys, a choice as its name and an automatic number as 'auto'. */
export type Settings = Partial<Record<SettingKey, string | number | boolean>>;

export function settingsFromEngine(s: EngineSettings): Settings {
  const out: Settings = {};
  for (const f of SettingsSchema.fields) {
    const v: unknown = s[f.localName as keyof EngineSettings];
    const key = f.name as SettingKey;
    if (v === undefined) continue;
    if (f.fieldKind === 'enum') {
      if (v !== 0) out[key] = f.enum.value[v as number]?.localName.toLowerCase();
    } else if (f.fieldKind === 'message') {
      const n = v as AutoNumber;
      out[key] = n.automatic ? 'auto' : String(n.value);
    } else if (f.fieldKind === 'scalar') {
      out[key] = v as string | number | boolean;
    }
  }
  return out;
}

export function settingsForEngine(s: Settings): EngineSettings {
  const init: Record<string, unknown> = {};
  for (const f of SettingsSchema.fields) {
    const v = s[f.name as SettingKey];
    if (v === undefined) continue;
    if (f.fieldKind === 'enum') {
      const e = f.enum.values.find((e) => e.number !== 0 && e.localName.toLowerCase() === v);
      if (e) init[f.localName] = e.number;
    } else if (f.fieldKind === 'message') {
      const value = Number(v);
      if (v === 'auto') init[f.localName] = { automatic: true };
      else if (Number.isFinite(value)) init[f.localName] = { value };
    } else if (f.fieldKind === 'scalar') {
      if (f.scalar === ScalarType.STRING) init[f.localName] = String(v);
      else if (f.scalar === ScalarType.BOOL) init[f.localName] = v === true;
      else if (Number.isFinite(Number(v))) init[f.localName] = Number(v);
    }
  }
  return create(SettingsSchema, init);
}

export type MinimapPlace = { name: string; x: number; y: number; spawn: string };

// Not in the engine's answers yet; the mock answers with some of them.
export interface InstalledMod {
  name: string;
  installed: number;
  folders: string[];
  size: number;
}

export type ModsStatus = EngineModsStatus & { installed?: InstalledMod[] };

export type JoinCheck = EngineJoinCheck & { map?: string };

interface LauncherOnly {
  uninstallMod: { args: { name: string }; result: { uninstalled: string[] } };
}

interface Extended {
  mods: ModsStatus;
  join: JoinCheck;
}

type EngineCommand = Exclude<Request['command']['case'], undefined | 'handshake' | 'shutdown'>;
type Answer<C> = Extract<Response['answer'], { case: C }>['value'];
type Init<C> = Extract<MessageInitShape<typeof RequestSchema>['command'], { case: C }>['value'];

export type Command = EngineCommand | keyof LauncherOnly;
export type CommandArgs<C extends Command> = C extends EngineCommand
  ? Init<C>
  : C extends keyof LauncherOnly
    ? LauncherOnly[C]['args']
    : never;
export type CommandResult<C extends Command> = C extends keyof Extended
  ? Extended[C]
  : C extends EngineCommand
    ? Answer<C>
    : C extends keyof LauncherOnly
      ? LauncherOnly[C]['result']
      : never;

export type EngineEvent = Exclude<Event['event'], { case: undefined }>;

export const ENGINE_COMMANDS = RequestSchema.oneofs[0].fields
  .map((f) => f.localName)
  .filter((c) => c !== 'handshake' && c !== 'shutdown') as EngineCommand[];

export const COMMANDS: readonly Command[] = [...ENGINE_COMMANDS, 'uninstallMod'];
