// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { EngineProvider, useCommand } from '../lib/engine';
import type { EngineStatus } from '../types/scaffold';
import type { NeoomsiBridge } from '../types/neoomsi';

afterEach(() => {
  cleanup();
  delete (window as { neoomsi?: NeoomsiBridge }).neoomsi;
});

function Pads() {
  const { data, error, reload } = useCommand('controllers');
  if (error)
    return (
      <button type="button" onClick={reload}>
        {error}
      </button>
    );
  return <p>{data ? `${data.controllers.length} controllers` : 'looking'}</p>;
}

describe('a request the engine dies on', () => {
  it('shows why instead of spinning, and retrying starts the engine again', async () => {
    let push: (s: EngineStatus) => void = () => {};
    let fail: (e: Error) => void = () => {};
    let starts = 0;
    let crashes = true;
    window.neoomsi = {
      getEngineStatus: async () => ({ connectionState: 'connected', capabilities: [] }),
      startEngine: async () => {
        starts++;
        crashes = false;
        const s: EngineStatus = { connectionState: 'connected', capabilities: [] };
        push(s);
        return s;
      },
      onEngineStatus: (cb: (s: EngineStatus) => void) => {
        push = cb;
        return () => {};
      },
      onDiagnosticLog: () => () => {},
      onEngineEvent: () => () => {},
      call: (command: string) =>
        command === 'controllers' && crashes
          ? new Promise((_, reject) => (fail = reject))
          : Promise.resolve(command === 'controllers' ? { controllers: [] } : { instances: [] }),
    } as unknown as NeoomsiBridge;

    render(
      <EngineProvider>
        <Pads />
      </EngineProvider>,
    );
    await screen.findByText('looking');

    const exit = 'Process exited with code 3221226505';
    await act(async () => {
      push({ connectionState: 'disconnected', capabilities: [], lastError: exit });
    });
    await act(async () => fail(new Error('Engine process exited')));

    const retry = await screen.findByText(exit);
    await act(async () => retry.click());
    await waitFor(() => expect(screen.getByText('0 controllers')).toBeTruthy());
    expect(starts).toBe(1);
  });
});
