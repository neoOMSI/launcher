import { describe, it, expect } from 'vitest';
import { MockEngineClient } from '../../electron/mock-client';
import {
  SessionState,
  settingsForEngine,
  settingsFromEngine,
  type CommandResult,
  type EngineEvent,
  type InstanceList,
  type LineList,
  type MapList,
  type Settings,
} from '../types/launcher';

function collect(client: MockEngineClient) {
  const events: EngineEvent[] = [];
  client.on('event', (event: EngineEvent) => events.push(event));
  return events;
}

describe('MockEngineClient', () => {
  it('starts disconnected and rejects requests', async () => {
    const client = new MockEngineClient();
    expect(client.getStatus().connectionState).toBe('disconnected');

    await expect(client.sendRequest('maps', {})).rejects.toThrow('Mock engine is not connected');
  });

  it('connects upon start(), emits status and advertises its commands', async () => {
    const client = new MockEngineClient();
    let statusEmitted = false;
    client.on('status', (status) => {
      if (status.connectionState === 'connected') {
        statusEmitted = true;
      }
    });

    const status = await client.start();
    expect(status.connectionState).toBe('connected');
    expect(status.capabilities).toContain('events.instances');
    expect(status.commands).toContain('launch');
    expect(statusEmitted).toBe(true);
    await expect(client.sendRequest('get_maps', {})).rejects.toThrow(/Unsupported/);
    await client.stop();
  });

  it('pushes the game list and session states when a game starts and stops', async () => {
    const client = new MockEngineClient();
    await client.start();
    const events = collect(client);

    const { pid } = await client.sendRequest<{ pid: number }>('launch', {
      map: 'maps/Grundorf/global.cfg',
      bus: 'Vehicles/MAN/MAN SL200.bus',
      time: '09:00',
    });
    const listed = events.find((e) => e.case === 'instancesChanged');
    expect(
      listed?.case === 'instancesChanged' && listed.value.instances.some((i) => i.pid === pid),
    ).toBe(true);
    const started = events.find((e) => e.case === 'sessionEvent');
    expect(started?.case === 'sessionEvent' && started.value.state).toBe(SessionState.STARTING);

    await client.sendRequest('stop', { pid });
    const last = events.at(-1);
    expect(last?.case === 'sessionEvent' && last.value.state).toBe(SessionState.EXITED);
    await client.stop();
  });

  it('pushes install progress', async () => {
    const client = new MockEngineClient();
    await client.start();
    const events = collect(client);
    await client.sendRequest('startInstall', { path: 'C:/Downloads/Bus.zip' });
    expect(events.some((e) => e.case === 'installsChanged')).toBe(true);
    await client.stop();
  });

  it('resets state upon stop()', async () => {
    const client = new MockEngineClient();
    await client.start();
    await client.stop();

    expect(client.getStatus().connectionState).toBe('disconnected');
    await expect(client.sendRequest('maps', {})).rejects.toThrow('Mock engine is not connected');
  });

  it('answers the neoOMSI launcher commands', async () => {
    const client = new MockEngineClient();
    await client.start();

    const { maps } = await client.sendRequest<MapList>('maps', {});
    expect(maps.map((m) => m.name)).toContain('Grundorf');

    const { lines } = await client.sendRequest<LineList>('lines', {
      map: 'maps/Grundorf/global.cfg',
      date: '1989-05-30',
    });
    const line24 = lines.find((l) => l.name === '24')!;
    expect(line24.tours[0].runs).toBe(true);
    expect(line24.tours[0].trips[0].departure).toBeLessThan(line24.tours[0].trips[0].arrival);

    const saved = await client.sendRequest<CommandResult<'saveSettings'>>(
      'saveSettings',
      settingsForEngine({ vsync: false }),
    );
    const settings: Settings = settingsFromEngine(saved);
    expect(settings.vsync).toBe(false);
    expect(settings.msaa).toBe(4);

    const { pid } = await client.sendRequest<{ pid: number }>('launch', {
      map: 'maps/Grundorf/global.cfg',
      bus: 'Vehicles/MAN/MAN SL200.bus',
      time: '09:00',
    });
    await client.sendRequest('stop', { pid });
    const { instances } = await client.sendRequest<InstanceList>('instances', {});
    const instance = instances.find((i) => i.pid === pid)!;
    expect(instance.running).toBe(false);
    expect(instance.exitCode).toBe(0);
  });
});
