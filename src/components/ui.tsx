import React, {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Icon } from './Icon';

export { Select } from './Select';

export const Switch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    className="switch"
    onClick={() => onChange(!checked)}
  />
);

export const Slider: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  label?: string;
}> = ({ value, min, max, step = 1, onChange, format = String, label }) => (
  <div className="flex w-full items-center gap-4">
    <input
      type="range"
      className="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      style={{ '--fill': `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    <span className="w-16 shrink-0 text-right text-[15px] font-medium text-heading tabular-nums">
      {format(value)}
    </span>
  </div>
);

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  fill,
}: {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  fill?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const el = track.current!;
    const measure = () => {
      const on = el.querySelector<HTMLElement>('.seg[aria-pressed="true"]');
      setThumb(on ? { left: on.offsetLeft, width: on.offsetWidth } : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, options.map(([, text]) => text).join('|')]);

  return (
    <div
      ref={track}
      className={fill ? 'segmented flex w-full [&>.seg]:flex-1 [&>.seg]:px-2' : 'segmented'}
      role="group"
      aria-label={label}
    >
      {thumb && (
        <span
          aria-hidden="true"
          className="seg-thumb"
          style={{ width: thumb.width, transform: `translateX(${thumb.left}px)` }}
        />
      )}
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          className="seg"
          aria-pressed={v === value}
          onClick={() => onChange(v)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export const EmptyState: React.FC<{ icon?: string; title: string; children?: ReactNode }> = ({
  icon,
  title,
  children,
}) => (
  <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-8 py-14 text-center">
    {icon && (
      <span className="mb-4 grid size-12 place-items-center text-muted">
        <Icon name={icon} size={32} />
      </span>
    )}
    <p className="font-semibold text-heading">{title}</p>
    {children && <div className="mt-1.5 max-w-[30em] text-[15px] text-muted">{children}</div>}
  </div>
);

export const Notice: React.FC<{
  tone?: 'note' | 'tip' | 'warning' | 'caution';
  icon?: string;
  title?: string;
  className?: string;
  children?: ReactNode;
}> = ({ tone = 'note', icon, title, className = '', children }) => (
  <div className={`callout callout-${tone} text-[15.5px] ${className}`} role="status">
    {title && (
      <p className="callout-title">
        {icon && <Icon name={icon} size={18} />}
        {title}
      </p>
    )}
    {children}
  </div>
);

export const Badge: React.FC<{ color?: string; children: ReactNode }> = ({
  color = 'var(--color-brand)',
  children,
}) => (
  <span className="label" style={{ '--lc': color } as CSSProperties}>
    {children}
  </span>
);

export const Field: React.FC<{ label: string; hint?: string; children: ReactNode }> = ({
  label,
  hint,
  children,
}) => (
  <label className="block min-w-0">
    <span className="mb-2 block text-[14px] font-semibold text-muted">{label}</span>
    {children}
    {hint && <span className="mt-1.5 block text-[14px] text-muted">{hint}</span>}
  </label>
);

export const Spinner: React.FC<{ label: string }> = ({ label }) => (
  <p className="flex items-center gap-2.5 py-6 text-muted">
    <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-brand" />
    {label}
  </p>
);
