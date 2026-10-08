function parts(v: string): [number[], string] {
  const clean = v.trim().replace(/^v/i, '').split('+')[0];
  const dash = clean.indexOf('-');
  const core = dash < 0 ? clean : clean.slice(0, dash);
  const pre = dash < 0 ? '' : clean.slice(dash + 1);
  return [core.split('.').map((n) => Number.parseInt(n, 10) || 0), pre];
}

export function newerVersion(a: string, b: string): boolean {
  const [an, ap] = parts(a);
  const [bn, bp] = parts(b);
  for (let i = 0; i < Math.max(an.length, bn.length); i++) {
    if ((an[i] ?? 0) !== (bn[i] ?? 0)) return (an[i] ?? 0) > (bn[i] ?? 0);
  }
  if (ap === bp) return false;
  if (!ap) return true;
  if (!bp) return false;
  return ap > bp;
}
