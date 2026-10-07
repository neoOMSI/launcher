import { describe, it, expect } from 'vitest';
import { MockEngineClient } from '../../electron/mock-client';
import { StatusCode } from '../types/scaffold';
import type { Instance, LineInfo, MapInfo, Settings } from '../types/launcher';
import type {
  GetMapsResponse,
  GetSettingsResponse,
  GetVehiclesResponse,
  StartSessionResponse,
} from '../types/scaffold';

describe('MockEngineClient', () => {
  it('starts disconnected and rejects requests', async () => {
    const client = new MockEngineClient();
    expect(client.getStatus().connectionState).toBe('disconnected');

    await expect(client.sendRequest('get_maps', {})).rejects.toThrow(
      'Mock engine is not connected',
    );
  });

  it('connects upon start() and emits status', async () => {
    const client = new MockEngineClient();
    let statusEmitted = false;
    client.on('status', (status) => {
      if (status.connectionState === 'connected') {
        statusEmitted = true;
      }
    });

    const status = await client.start();
    expect(status.connectionState).toBe('connected');
    expect(status.capabilities).toContain('content.discovery');
    expect(statusEmitted).toBe(true);
  });

  it('serves mock content and settings', async () => {
    const client = new MockEngineClient();
    await client.start();

    const mapsRes = await client.sendRequest<GetMapsResponse>('get_maps', {});
    expect(mapsRes.status.code).toBe(StatusCode.STATUS_OK);
    expect(mapsRes.maps.length).toBeGreaterThan(0);

    const vehiclesRes = await client.sendRequest<GetVehiclesResponse>('get_vehicles', {});
    expect(vehiclesRes.status.code).toBe(StatusCode.STATUS_OK);
    expect(vehiclesRes.vehicles.length).toBeGreaterThan(0);

    const settingsRes = await client.sendRequest<GetSettingsResponse>('get_settings', {});
    expect(settingsRes.status.code).toBe(StatusCode.STATUS_OK);
    expect(settingsRes.settingsJson).toContain('graphics');
  });

  it('launches mock sessions and emits session events', async () => {
    const client = new MockEngineClient();
    await client.start();

    const eventPromise = new Promise<{ sessionId: string; state: number }>((resolve) => {
      client.on('session_event', (event) => {
        resolve(event);
      });
    });

    const sessionRes = await client.sendRequest<StartSessionResponse>('start_session', {
      mapId: 'berlin-spandau',
      vehicleId: 'man-sd200-sd80',
    });

    expect(sessionRes.status.code).toBe(StatusCode.STATUS_OK);
    expect(sessionRes.sessionId).toBeDefined();

    const event = await eventPromise;
    expect(event.sessionId).toBe(sessionRes.sessionId);
    expect(event.state).toBe(3);
  });

  it('resets state upon stop()', async () => {
    const client = new MockEngineClient();
    await client.start();
    await client.stop();

    expect(client.getStatus().connectionState).toBe('disconnected');
    await expect(client.sendRequest('get_maps', {})).rejects.toThrow(
      'Mock engine is not connected',
    );
  });
  it('answers the neoOMSI launcher commands', async () => {
    const client = new MockEngineClient();
    await client.start();

    const maps = await client.sendRequest<MapInfo[]>('maps', {});
    expect(maps.map((m) => m.name)).toContain('Grundorf');

    const lines = await client.sendRequest<LineInfo[]>('lines', {
      map: 'maps/Grundorf/global.cfg',
      date: '1989-05-30',
    });
    const line24 = lines.find((l) => l.name === '24')!;
    expect(line24.tours[0].runs).toBe(true);
    expect(line24.tours[0].trips[0].departure).toBeLessThan(line24.tours[0].trips[0].arrival);

    const settings = await client.sendRequest<Settings>('save_settings', { vsync: false });
    expect(settings.vsync).toBe(false);
    expect(settings.msaa).toBe(4);

    const { pid } = await client.sendRequest<{ pid: number }>('launch', {
      map: 'maps/Grundorf/global.cfg',
      bus: 'Vehicles/MAN/MAN SL200.bus',
      time: '09:00',
    });
    await client.sendRequest('stop', { pid });
    const [instance] = await client.sendRequest<Instance[]>('instances', {});
    expect(instance.running).toBe(false);
    expect(instance.exit_code).toBe(0);
  });
});
