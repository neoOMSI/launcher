import type { Instance } from '../../types/launcher';

export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function exitState(
  i: Pick<Instance, 'running' | 'stopping' | 'killed' | 'exitCode'>,
): 'running' | 'stopping' | 'clean' | 'killed' | 'crashed' | 'ended' {
  if (i.running) return i.stopping ? 'stopping' : 'running';
  if (i.killed) return 'killed';
  if (i.exitCode === 0) return 'clean';
  return i.exitCode === undefined ? 'ended' : 'crashed';
}

// Windows reports crashes as NTSTATUS values, which read better in hex (0xC0000005).
export function exitCodeText(code: number): string {
  if (code >= 0 && code < 256) return String(code);
  return `0x${(code >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}

export function chatLine(line: string): [string | null, string] {
  const at = line.indexOf(': ');
  return at > 0 ? [line.slice(0, at), line.slice(at + 2)] : [null, line];
}
