import { describe, expect, it } from 'vitest';
import {
  addServer,
  fill,
  filterServers,
  hostingPatch,
  isFull,
  isHosting,
  joinTarget,
  mapLabel,
  ownServers,
  removeServer,
  resolveMap,
  serverTitle,
} from '../pages/multiplayer/servers';
import type { Choice } from '../lib/duty';
import type { MapInfo, ServerInfo } from '../types/launcher';

const MAPS = [
  { name: 'Grundorf', friendly: 'Grundorf', file: 'maps/Grundorf/global.cfg' },
  {
    name: 'Berlin-Spandau',
    friendly: 'Berlin-Spandau 1989',
    file: 'maps/Berlin-Spandau/global.cfg',
  },
] as MapInfo[];

const server = (s: Partial<ServerInfo>): ServerInfo => ({
  address: 'a',
  name: '',
  official: false,
  motd: '',
  map: '',
  time: '',
  weather: '',
  players: 0,
  max_players: 0,
  error: null,
  ...s,
});

const SERVERS = [
  server({
    address: 'play.neoomsi.org',
    name: 'Official',
    official: true,
    map: 'Berlin-Spandau 1989',
  }),
  server({ address: '85.214.20.17:7777', name: 'Stammtisch', motd: 'Thursdays' }),
  server({ address: 'omsi.example.net', error: 'connection refused' }),
];

describe('server maps', () => {
  it('resolves files, friendly names, folder names and Windows paths', () => {
    expect(resolveMap('maps/Grundorf/global.cfg', MAPS)?.name).toBe('Grundorf');
    expect(resolveMap('MAPS\\Grundorf\\global.cfg', MAPS)?.name).toBe('Grundorf');
    expect(resolveMap('Berlin-Spandau 1989', MAPS)?.name).toBe('Berlin-Spandau');
    expect(resolveMap('maps/Hamburg/global.cfg', MAPS)).toBeUndefined();
    expect(resolveMap('', MAPS)).toBeUndefined();
  });

  it('labels a missing map by its folder', () => {
    expect(mapLabel('maps/Grundorf/global.cfg', MAPS)).toBe('Grundorf');
    expect(mapLabel('maps/Hamburg-Dammtor/global.cfg', MAPS)).toBe('Hamburg-Dammtor');
    expect(mapLabel('Somewhere', MAPS)).toBe('Somewhere');
  });
});

describe('server list', () => {
  it('names a server by its address when it has no name', () => {
    expect(serverTitle(SERVERS[2])).toBe('omsi.example.net');
  });

  it('filters by name, address, message and map', () => {
    expect(filterServers(SERVERS, 'thurs').map((s) => s.name)).toEqual(['Stammtisch']);
    expect(filterServers(SERVERS, 'spandau', MAPS).map((s) => s.name)).toEqual(['Official']);
    expect(filterServers(SERVERS, 'example')).toHaveLength(1);
    expect(filterServers(SERVERS, '')).toHaveLength(3);
  });

  it('fills the player bar', () => {
    expect(fill({ players: 4, max_players: 12 })).toBeCloseTo(1 / 3);
    expect(fill({ players: 0, max_players: 0 })).toBe(0);
    expect(isFull({ players: 10, max_players: 10 })).toBe(true);
    expect(isFull({ players: 0, max_players: 0 })).toBe(false);
  });

  it('saves only the player’s own servers', () => {
    expect(ownServers(SERVERS)).toEqual([
      { name: 'Stammtisch', address: '85.214.20.17:7777' },
      { name: '', address: 'omsi.example.net' },
    ]);
    expect(removeServer(SERVERS, 'omsi.example.net')).toEqual([
      { name: 'Stammtisch', address: '85.214.20.17:7777' },
    ]);
  });

  it('adds a server once, trimmed', () => {
    expect(addServer(SERVERS, '  Mine ', ' 10.0.0.2:7777 ')).toEqual({
      list: [...ownServers(SERVERS), { name: 'Mine', address: '10.0.0.2:7777' }],
    });
    expect(addServer(SERVERS, '', '   ')).toEqual({ error: 'empty' });
    expect(addServer(SERVERS, 'x', 'PLAY.neoomsi.org')).toEqual({ error: 'duplicate' });
  });
});

describe('joining and hosting', () => {
  it('turns a code into a join target', () => {
    const target = joinTarget(' OMSI-7KQ2-M4XD ', 'The host drives on Grundorf');
    expect(target).toMatchObject({
      address: 'OMSI-7KQ2-M4XD',
      name: 'OMSI-7KQ2-M4XD',
      error: null,
    });
  });

  it('reads and writes the hosting flag on the duty', () => {
    const choice = { map: '' } as Choice;
    expect(isHosting(choice)).toBe(false);
    expect(isHosting({ ...choice, ...hostingPatch(true) })).toBe(true);
    expect(isHosting({ ...choice, ...hostingPatch(false) })).toBe(false);
  });
});
