import type { ReactNode, Ref } from 'react';
import { Icon } from './Icon';

export function Screen({
  title,
  actions,
  nav,
  children,
}: {
  title?: string;
  actions?: ReactNode;
  nav?: ReactNode;
  children: ReactNode;
}) {
  if (title === undefined)
    return (
      <div className="stage-calm relative mr-3 mb-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl">
        <div className="min-h-0 flex-1 overflow-y-auto px-10 pt-9 pb-12">{children}</div>
      </div>
    );
  return (
    <div className="stage-calm relative mr-3 mb-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl">
      <header className="shrink-0 px-10 pt-8">
        <div className="flex min-h-12 items-center justify-between gap-6">
          <h1 className="truncate font-display text-[2.6rem] leading-tight font-bold tracking-tight">
            {title}
          </h1>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        {nav && <div className="mt-5">{nav}</div>}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-10 pt-8 pb-12">{children}</div>
    </div>
  );
}

export function PillNav<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly (readonly [T, string, string])[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <nav className="flex flex-wrap gap-1">
      {items.map(([id, label, icon]) => (
        <button
          key={id}
          type="button"
          aria-current={id === value ? 'page' : undefined}
          className={`nav-link w-auto pr-4 ${id === value ? 'on' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon name={icon} size={20} />
          {label}
        </button>
      ))}
    </nav>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  className = 'w-64',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`search ${className}`}>
      <Icon name="search" size={20} />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onChange('')}
      />
    </label>
  );
}

export function PanelScreen({
  panel,
  children,
  width = 'w-[clamp(18rem,22vw,22rem)]',
  bodyRef,
}: {
  panel: ReactNode;
  children: ReactNode;
  width?: string;
  bodyRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div className="stage-calm relative mr-3 mb-3 flex min-h-0 flex-1 overflow-hidden rounded-3xl">
      <div className={`relative shrink-0 ${width}`}>
        <aside className="absolute top-2 right-0 bottom-2 left-2 flex flex-col overflow-hidden rounded-[1.25rem] bg-page shadow-2xl">
          {panel}
        </aside>
      </div>
      <div ref={bodyRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto pt-9 pr-10 pb-12 pl-8">
        {children}
      </div>
    </div>
  );
}
