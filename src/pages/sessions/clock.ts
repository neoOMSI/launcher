import type { LanStatus } from '../../types/launcher';

export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function exitState(i: {
  running: boolean;
  stopping: number | null;
  killed: boolean;
  exit_code: number | null;
}): 'running' | 'stopping' | 'clean' | 'killed' | 'crashed' | 'ended' {
  if (i.running) return i.stopping ? 'stopping' : 'running';
  if (i.killed) return 'killed';
  if (i.exit_code === 0) return 'clean';
  return i.exit_code === null ? 'ended' : 'crashed';
}

// Windows reports crashes as NTSTATUS values, which read better in hex (0xC0000005).
export function exitCodeText(code: number): string {
  if (code >= 0 && code < 256) return String(code);
  return `0x${(code >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}

export function readLan(lan: Partial<LanStatus> | null | undefined): LanStatus | null {
  if (!lan) return null;
  return {
    role: lan.role === 'host' ? 'host' : 'join',
    code: lan.code ?? '',
    tunnel: lan.tunnel ?? false,
    connected: lan.connected ?? false,
    host_name: lan.host_name ?? '',
    rejected: lan.rejected ?? '',
    players: lan.players ?? [],
    chat: lan.chat ?? [],
    warnings: lan.warnings ?? [],
  };
}

export function chatLine(line: string): [string | null, string] {
  const at = line.indexOf(': ');
  return at > 0 ? [line.slice(0, at), line.slice(at + 2)] : [null, line];
}
