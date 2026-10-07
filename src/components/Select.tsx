import React, { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export type SelectOption<T> = readonly [T, string, ReactNode?];

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  className = '',
  disabled,
  label,
}: {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<{ left: number; top: number; width: number; up: boolean }>();
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const current = options.find(([v]) => v === value);

  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const r = button.current.getBoundingClientRect();
    const up = window.innerHeight - r.bottom < 300 && r.top > window.innerHeight - r.bottom;
    setPlace({ left: r.left, top: up ? r.top - 6 : r.bottom + 6, width: r.width, up });
    setActive(
      Math.max(
        0,
        options.findIndex(([v]) => v === value),
      ),
    );
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const target = e.target as Node;
      if (list.current?.contains(target) || button.current?.contains(target)) return;
      setOpen(false);
    };
    const shut = () => setOpen(false);
    window.addEventListener('pointerdown', close, true);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', shut);
    return () => {
      window.removeEventListener('pointerdown', close, true);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', shut);
    };
  }, [open]);

  useEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const pick = (i: number) => {
    const option = options[i];
    if (option) onChange(option[0]);
    setOpen(false);
    button.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open) pick(active);
      else setOpen(true);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKey}
        className={`select flex items-center gap-3 text-left ${open ? 'border-brand' : ''} ${className}`}
      >
        {current?.[2]}
        <span className="min-w-0 flex-1 truncate">{current?.[1] ?? (String(value) || '–')}</span>
      </button>
      {open &&
        place &&
        createPortal(
          <ul
            ref={list}
            id={id}
            role="listbox"
            onKeyDown={onKey}
            style={{
              left: place.left,
              width: place.width,
              ...(place.up ? { bottom: window.innerHeight - place.top } : { top: place.top }),
            }}
            className="fixed z-50 max-h-[18rem] overflow-y-auto rounded-xl border border-line-strong bg-raised p-1.5 shadow-2xl"
          >
            {options.map(([v, text, lead], i) => (
              <li
                key={String(v)}
                role="option"
                aria-selected={v === value}
                onPointerEnter={() => setActive(i)}
                onClick={() => pick(i)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[15.5px] ${
                  i === active ? 'bg-line text-heading' : 'text-ink'
                }`}
              >
                {lead}
                <span className="min-w-0 flex-1 truncate">{text}</span>
                {v === value && <Icon name="check" size={18} style={{ color: 'var(--accent)' }} />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
