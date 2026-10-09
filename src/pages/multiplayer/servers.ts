import type { Choice } from '../../lib/duty';
import { create } from '@bufbuild/protobuf';
import { ServerInfoSchema, type MapInfo, type ServerInfo } from '../../types/launcher';

export interface ServerEntry {
  name: string;
  address: string;
}

const norm = (value: string) => value.trim().replace(/\\/g, '/').toLowerCase();

function folderOf(value: string): string {
  const parts = norm(value).split('/').filter(Boolean);
  const last = parts[parts.length - 1] ?? '';
  return /\.cfg$/.test(last) ? (parts[parts.length - 2] ?? last) : last;
}

export function resolveMap(value: string, maps: MapInfo[]): MapInfo | undefined {
  const v = norm(value);
  if (!v) return undefined;
  return maps.find(
    (m) =>
      norm(m.file) === v ||
      m.friendly.toLowerCase() === v ||
      m.name.toLowerCase() === v ||
      (v.includes('/') && folderOf(v) === m.name.toLowerCase()),
  );
}

export function mapLabel(value: string, maps: MapInfo[]): string {
  const map = resolveMap(value, maps);
  if (map) return map.friendly;
  if (!value.includes('/') && !value.includes('\\')) return value;
  const parts = value.replace(/\\/g, '/').split('/').filter(Boolean);
  const last = parts[parts.length - 1] ?? value;
  return /\.cfg$/i.test(last) ? (parts[parts.length - 2] ?? last) : last;
}

export const serverTitle = (server: Pick<ServerInfo, 'name' | 'address'>) =>
  server.name.trim() || server.address;

export function filterServers(servers: ServerInfo[], query: string, maps: MapInfo[] = []) {
  const q = query.trim().toLowerCase();
  if (!q) return servers;
  return servers.filter((s) =>
    [s.name, s.address, s.motd, s.map, mapLabel(s.map, maps)].some((f) =>
      f.toLowerCase().includes(q),
    ),
  );
}

export const fill = (server: Pick<ServerInfo, 'players' | 'maxPlayers'>) =>
  server.maxPlayers > 0 ? Math.min(1, server.players / server.maxPlayers) : 0;

export const isFull = (server: Pick<ServerInfo, 'players' | 'maxPlayers'>) =>
  server.maxPlayers > 0 && server.players >= server.maxPlayers;

export const ownServers = (servers: ServerInfo[]): ServerEntry[] =>
  servers.filter((s) => !s.official).map(({ name, address }) => ({ name, address }));

export type AddError = 'empty' | 'duplicate';

export function addServer(
  servers: ServerInfo[],
  name: string,
  address: string,
): { list: ServerEntry[] } | { error: AddError } {
  const a = address.trim();
  if (!a) return { error: 'empty' };
  if (servers.some((s) => s.address.trim().toLowerCase() === a.toLowerCase())) {
    return { error: 'duplicate' };
  }
  return { list: [...ownServers(servers), { name: name.trim(), address: a }] };
}

export const removeServer = (servers: ServerInfo[], address: string): ServerEntry[] =>
  ownServers(servers).filter((s) => s.address !== address);

export const joinTarget = (text: string, answer: string): ServerInfo =>
  create(ServerInfoSchema, { address: text.trim(), name: text.trim(), motd: answer });

type WithLan = Choice & { lan?: 'host' | 'off' };

export const isHosting = (choice: Choice) => (choice as WithLan).lan === 'host';

export function hostingPatch(on: boolean): Partial<Choice> {
  const patch: Partial<WithLan> = { lan: on ? 'host' : 'off' };
  return patch;
}

export function sortServers(servers: ServerInfo[]): ServerInfo[] {
  const rank = (s: ServerInfo) => (s.error !== undefined ? 2 : s.official ? 0 : 1);
  return [...servers].sort((a, b) => rank(a) - rank(b) || b.players - a.players);
}
