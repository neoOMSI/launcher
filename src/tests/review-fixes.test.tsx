// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { UpdateBanner } from '../components/UpdateBanner';
import { EngineProvider } from '../lib/engine';
import { SettingsProvider, useSettings } from '../lib/settings';
import type { NeoomsiBridge } from '../types/neoomsi';

interface Fake {
  calls: string[];
  settings: Record<string, unknown> | null;
  failSave: boolean;
  releaseSettings?: () => void;
}

function bridge(fake: Fake) {
  const noop = () => () => {};
  window.neoomsi = {
    getEngineStatus: async () => ({ connectionState: 'connected', capabilities: [] }),
    startEngine: async () => ({ connectionState: 'connected', capabilities: [] }),
    onEngineStatus: noop,
    onDiagnosticLog: noop,
    onEngineEvent: noop,
    openExternal: async () => {},
    call: async (command: string, args?: unknown) => {
      fake.calls.push(command);
      if (command === 'settings') {
        if (!fake.settings) await new Promise<void>((r) => (fake.releaseSettings = r));
        return fake.settings;
      }
      if (command === 'save_settings') {
        if (fake.failSave) throw new Error('disk full');
        return { ...fake.settings, ...(args as object) };
      }
      if (command === 'update_check') return null;
      return [];
    },
  } as unknown as NeoomsiBridge;
}

afterEach(() => {
  cleanup();
  delete (window as { neoomsi?: NeoomsiBridge }).neoomsi;
});

describe('saving a setting', () => {
  let save: ReturnType<typeof useSettings>['save'] = async () => {};
  const Grab = () => {
    save = useSettings().save;
    return null;
  };

  const mount = async (fake: Fake) => {
    bridge(fake);
    render(
      <EngineProvider>
        <SettingsProvider>
          <Grab />
        </SettingsProvider>
      </EngineProvider>,
    );
    await waitFor(() => expect(fake.calls).toContain('settings'));
  };

  it('resolves only once the engine stored it', async () => {
    const fake: Fake = { calls: [], settings: { pax_models: 'omsi' }, failSave: false };
    await mount(fake);
    await act(() => save({ pax_models: 'realistic' }));
    expect(fake.calls).toContain('save_settings');
  });

  it('rejects when the engine could not store it', async () => {
    const fake: Fake = { calls: [], settings: { pax_models: 'omsi' }, failSave: true };
    await mount(fake);
    await act(() => expect(save({ pax_models: 'realistic' })).rejects.toThrow('disk full'));
  });
});

describe('the update banner', () => {
  const mount = (fake: Fake) => {
    bridge(fake);
    render(
      <EngineProvider>
        <SettingsProvider>
          <UpdateBanner />
        </SettingsProvider>
      </EngineProvider>,
    );
  };

  it('does not check before the settings are known', async () => {
    const fake: Fake = { calls: [], settings: null, failSave: false };
    mount(fake);
    await waitFor(() => expect(fake.calls).toContain('settings'));
    expect(fake.calls).not.toContain('update_check');
    fake.settings = { update_check: true };
    await act(async () => fake.releaseSettings?.());
    await waitFor(() => expect(fake.calls).toContain('update_check'));
  });

  it('never checks when the player turned checks off', async () => {
    const fake: Fake = { calls: [], settings: { update_check: false }, failSave: false };
    mount(fake);
    await waitFor(() => expect(fake.calls).toContain('settings'));
    await new Promise((r) => setTimeout(r, 50));
    expect(fake.calls).not.toContain('update_check');
  });
});
