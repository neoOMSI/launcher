import React, { type CSSProperties, type ReactNode } from 'react';
import { Icon } from './Icon';

export const Page: React.FC<{
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  tabs?: ReactNode;
  className?: string;
  children: ReactNode;
}> = ({ title, subtitle, actions, tabs, className = '', children }) => (
  <div className="flex h-full min-h-0 flex-col">
    <header className="shrink-0 px-12 pt-10">
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0">
          <h1 className="section-title">{title}</h1>
          {subtitle && <p className="mt-2 max-w-[44em] text-[16px] text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
      </div>
      {tabs && <div className="mt-8">{tabs}</div>}
    </header>
    <div className={`min-h-0 flex-1 overflow-y-auto px-12 pt-8 pb-12 ${className}`}>{children}</div>
  </div>
);

export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly (readonly [T, string, string?])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="tabs">
      {items.map(([id, label, icon]) => (
        <button
          key={id}
          type="button"
          role="tab"
          className="tab"
          aria-selected={id === value}
          onClick={() => onChange(id)}
        >
          {icon && <Icon name={icon} size={18} />}
          {label}
        </button>
      ))}
    </div>
  );
}

export const Panel: React.FC<{
  title?: string;
  description?: string;
  icon?: string;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}> = ({ title, description, icon, actions, className = '', children }) => (
  <section className={`card p-7 ${className}`}>
    {(title || actions) && (
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {title && (
            <h2 className="flex items-center gap-2.5 font-sans text-[1.15rem]">
              {icon && <Icon name={icon} size={20} style={{ color: 'var(--accent)' }} />}
              {title}
            </h2>
          )}
          {description && <p className="mt-1.5 text-[15px] text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    )}
    {children}
  </section>
);

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

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  className = '',
  disabled,
  label,
}: {
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <select
      className={`select ${className}`}
      value={String(value)}
      disabled={disabled}
      aria-label={label}
      onChange={(e) => {
        const hit = options.find(([v]) => String(v) === e.target.value);
        if (hit) onChange(hit[0]);
      }}
    >
      {options.map(([v, text]) => (
        <option key={String(v)} value={String(v)}>
          {text}
        </option>
      ))}
    </select>
  );
}

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
}: {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
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

export const SettingGroup: React.FC<{
  title: string;
  description?: string;
  children: ReactNode;
}> = ({ title, description, children }) => (
  <section className="mb-12 last:mb-0">
    <h2 className="font-sans text-[1.15rem]">{title}</h2>
    {description && <p className="mt-1.5 max-w-[40em] text-[15px] text-muted">{description}</p>}
    <div className="mt-4 border-b border-line">{children}</div>
  </section>
);

export const SettingRow: React.FC<{
  label: string;
  hint?: string;
  wide?: boolean;
  children: ReactNode;
}> = ({ label, hint, wide, children }) => (
  <div
    className={`grid items-center gap-x-10 gap-y-3 border-t border-line py-4 ${
      wide ? 'grid-cols-1' : 'grid-cols-[minmax(0,1fr)_auto]'
    }`}
  >
    <div className="min-w-0">
      <p className="text-ink">{label}</p>
      {hint && <p className="mt-0.5 text-[14.5px] leading-snug text-muted">{hint}</p>}
    </div>
    <div className={wide ? '' : 'flex w-[18rem] justify-end'}>{children}</div>
  </div>
);

export const EmptyState: React.FC<{ icon?: string; title: string; children?: ReactNode }> = ({
  icon,
  title,
  children,
}) => (
  <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-8 py-14 text-center">
    {icon && (
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-sunken text-muted">
        <Icon name={icon} size={24} />
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
