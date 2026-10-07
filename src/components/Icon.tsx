import type { CSSProperties } from 'react';

const svgs = import.meta.glob<string>('../../assets/icons/material/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const PATHS: Record<string, string> = Object.fromEntries(
  Object.entries(svgs).map(([file, svg]) => [
    file.match(/(\w+)\.svg$/)![1],
    svg.match(/ d="([^"]+)"/)![1],
  ]),
);

export const iconPath = (name: string) => PATHS[name];

interface Props {
  name: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 18, color, style }: Props) {
  const d = PATHS[name];
  if (!d) throw new Error(`Missing icon ${name}`);
  return (
    <svg
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden="true"
      style={{ width: size, height: size, flex: 'none', color, ...style }}
    >
      <path d={d} />
    </svg>
  );
}
