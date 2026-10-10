import { describe, it, expect } from 'vitest';
import { create } from '@bufbuild/protobuf';
import {
  GraphicsMode,
  SettingsSchema,
  WindowMode,
  settingsForEngine,
  settingsFromEngine,
} from '../types/launcher';

describe('Typed settings', () => {
  it('reads choices by name and automatic numbers as auto', () => {
    const s = settingsFromEngine(
      create(SettingsSchema, {
        windowMode: WindowMode.BORDERLESS,
        graphics: GraphicsMode.VANILLA_PLUS,
        viewDistance: { automatic: true },
        maxObjDist: { value: 900 },
        timeSpeed: 2,
        uiOpacity: 0.8,
        language: 'de',
      }),
    );
    expect(s).toEqual({
      window_mode: 'borderless',
      graphics: 'vanilla_plus',
      view_distance: 'auto',
      max_obj_dist: '900',
      time_speed: 2,
      ui_opacity: 0.8,
      language: 'de',
    });
  });

  it('sends only what is set, and leaves out what the engine cannot take', () => {
    const e = settingsForEngine({
      graphics_api: 'dx12',
      render_scale: '0.75',
      max_obj_dist: 'auto',
      units: 'parsecs',
      msaa: 'many',
    });
    expect(e.graphicsApi).toBeDefined();
    expect(e.renderScale).toMatchObject({ automatic: false, value: 0.75 });
    expect(e.maxObjDist).toMatchObject({ automatic: true });
    expect(e.units).toBeUndefined();
    expect(e.msaa).toBeUndefined();
    expect(e.vsync).toBeUndefined();
    expect(settingsFromEngine(e)).toEqual({
      graphics_api: 'dx12',
      render_scale: '0.75',
      max_obj_dist: 'auto',
    });
  });
});
