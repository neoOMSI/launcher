import { create, type MessageInitShape } from '@bufbuild/protobuf';
import {
  RequestSchema,
  SettingsSchema,
  type Event,
  type JoinCheck as EngineJoinCheck,
  type Minimap as EngineMinimap,
  type ModsStatus as EngineModsStatus,
  type Request,
  type Response,
  type Settings as EngineSettings,
} from './launcher_pb';

export * from './launcher_pb';

export type Settings = Record<string, string | number | boolean>;

export function settingsFromEngine(s: EngineSettings): Settings {
  const out: Settings = {};
  for (const [key, { value }] of Object.entries(s.values)) {
    if (value.case !== undefined) out[key] = value.value;
  }
  return out;
}

export function settingsForEngine(s: Settings): EngineSettings {
  const values = Object.entries(s).map(([key, v]) => {
    const value =
      typeof v === 'boolean'
        ? { case: 'flag' as const, value: v }
        : typeof v === 'number'
          ? { case: 'number' as const, value: v }
          : { case: 'text' as const, value: v };
    return [key, { value }];
  });
  return create(SettingsSchema, { values: Object.fromEntries(values) });
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

export type Minimap = EngineMinimap & {
  lanes?: [number, number][][];
  trips?: Record<string, number[]>;
};

interface LauncherOnly {
  uninstallMod: { args: { name: string }; result: { uninstalled: string[] } };
}

interface Extended {
  mods: ModsStatus;
  join: JoinCheck;
  minimap: Minimap;
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
