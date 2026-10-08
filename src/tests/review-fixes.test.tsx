// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { UpdateBanner } from '../components/UpdateBanner';
import { EngineProvider } from '../lib/engine';
import { SettingsProvider, useSettings } from '../lib/settings';
import { setLanguage } from '../i18n';
import { PassengerPromo } from '../pages/drive/Promo';
import type { PaxPack } from '../types/launcher';
import type { NeoomsiBridge } from '../types/neoomsi';

interface Fake {
  calls: string[];
  settings: Record<string, unknown> | null;
  failSave: boolean;
  releaseSettings?: () => void;
  holdSave?: Promise<void>;
  pax?: PaxPack;
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
        await fake.holdSave;
        if (fake.failSave) throw new Error('disk full');
        return { ...fake.settings, ...(args as object) };
      }
      if (command === 'update_check') return null;
      if (command === 'pax_pack' || command === 'install_pax_pack') return fake.pax;
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
  let shown: ReturnType<typeof useSettings>['settings'] = null;
  const Grab = () => {
    const s = useSettings();
    save = s.save;
    shown = s.settings;
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

  const held = (fake: Fake) => {
    let release = () => {};
    fake.holdSave = new Promise<void>((r) => (release = r));
    return () => act(async () => release());
  };

  it('resolves only once the engine stored it', async () => {
    const fake: Fake = { calls: [], settings: { pax_models: 'omsi' }, failSave: false };
    const release = held(fake);
    await mount(fake);
    let done = false;
    let saving = Promise.resolve();
    act(() => {
      saving = save({ pax_models: 'realistic' }).then(() => {
        done = true;
      });
    });
    await waitFor(() => expect(fake.calls).toContain('save_settings'));
    await new Promise((r) => setTimeout(r, 20));
    expect(done).toBe(false);
    await release();
    await saving;
    expect(done).toBe(true);
  });

  it('keeps a change while it is being saved when the window gets the focus', async () => {
    const fake: Fake = { calls: [], settings: { pax_models: 'omsi' }, failSave: false };
    const release = held(fake);
    await mount(fake);
    let saving = Promise.resolve();
    act(() => {
      saving = save({ pax_models: 'realistic' });
    });
    await waitFor(() => expect(fake.calls).toContain('save_settings'));
    const reads = fake.calls.filter((c) => c === 'settings').length;
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(fake.calls.filter((c) => c === 'settings').length).toBe(reads);
    expect(shown?.pax_models).toBe('realistic');
    await release();
    await saving;
    expect(shown?.pax_models).toBe('realistic');
  });

  it('settles a save with nothing to change', async () => {
    const fake: Fake = { calls: [], settings: { pax_models: 'omsi' }, failSave: false };
    await mount(fake);
    await act(() => save({}));
    expect(fake.calls).not.toContain('save_settings');
  });

  it('rejects when the engine could not store it', async () => {
    const fake: Fake = { calls: [], settings: { pax_models: 'omsi' }, failSave: true };
    await mount(fake);
    await act(() => expect(save({ pax_models: 'realistic' })).rejects.toThrow('disk full'));
    await waitFor(() => expect(shown?.pax_models).toBe('omsi'));
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

describe('the passenger card', () => {
  it('offers the update when the newest release could not be looked up', async () => {
    setLanguage('en');
    const fake: Fake = {
      calls: [],
      settings: { pax_models: 'realistic' },
      failSave: false,
      pax: {
        state: 'outdated',
        done: 0,
        total: 0,
        message: '',
        installed: 1,
        latest: null,
      },
    };
    bridge(fake);
    render(
      <EngineProvider>
        <SettingsProvider>
          <PassengerPromo />
        </SettingsProvider>
      </EngineProvider>,
    );
    const update = await screen.findByRole('button', { name: /update/i });
    expect(screen.getByText(/out of date/i)).toBeDefined();
    expect(screen.queryByTitle(/hide/i)).toBeNull();
    fireEvent.click(update);
    await waitFor(() => expect(fake.calls).toContain('install_pax_pack'));
  });
});
