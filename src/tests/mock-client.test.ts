import { describe, it, expect } from 'vitest';
import { MockEngineClient } from '../../electron/mock-client';
import { StatusCode } from '../types/scaffold';
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
});
