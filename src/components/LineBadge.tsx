export function LineBadge({ line, size = 'md' }: { line: string; size?: 'sm' | 'md' | 'lg' }) {
  const box = {
    sm: 'h-6 min-w-9 px-1.5 text-[13px]',
    md: 'h-8 min-w-12 px-2 text-[16px]',
    lg: 'h-11 min-w-16 px-3 text-[22px]',
  }[size];
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-md bg-night font-display leading-none font-bold tracking-wide text-[#ffb11a] ring-1 ring-white/10 ${box}`}
    >
      {line}
    </span>
  );
}
