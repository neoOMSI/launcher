import React, { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../i18n';
import { filterBy } from '../lib/search';
import { Icon } from './Icon';

export type SelectOption<T> = readonly [T, string, ReactNode?];

const SEARCH_AT = 12;

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
  const [query, setQuery] = useState('');
  const [place, setPlace] = useState<{ left: number; top: number; width: number; up: boolean }>();
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const id = useId();
  const current = options.find(([v]) => v === value);
  const searchable = options.length > SEARCH_AT;
  const shown = searchable ? filterBy(options, query, ([, text]) => [text]) : options;

  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const r = button.current.getBoundingClientRect();
    const up = window.innerHeight - r.bottom < 300 && r.top > window.innerHeight - r.bottom;
    setPlace({ left: r.left, top: up ? r.top - 6 : r.bottom + 6, width: r.width, up });
    setQuery('');
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
      if (menu.current?.contains(target) || button.current?.contains(target)) return;
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
    if (open && place) search.current?.focus({ preventScroll: true });
  }, [open, place]);

  useEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const pick = (i: number) => {
    const option = shown[i];
    if (option) onChange(option[0]);
    setOpen(false);
    button.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return setOpen(true);
      move(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open) pick(active);
      else setOpen(true);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  const move = (step: number) => {
    if (shown.length) setActive((a) => (a + step + shown.length) % shown.length);
  };

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      move(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (shown[active]) pick(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      button.current?.focus();
    } else if (e.key === 'Tab') {
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
        className={`select flex items-center gap-3 text-left ${className}`}
      >
        {current?.[2]}
        <span className="min-w-0 flex-1 truncate">{current?.[1] ?? (String(value) || '–')}</span>
      </button>
      {open &&
        place &&
        createPortal(
          <div
            ref={menu}
            style={{
              left: place.left,
              width: place.width,
              ...(place.up ? { bottom: window.innerHeight - place.top } : { top: place.top }),
            }}
            data-up={place.up || undefined}
            className="menu flex flex-col overflow-hidden p-0"
          >
            {searchable && (
              <label className="search mx-1.5 mt-1.5 h-10 shrink-0 px-3.5">
                <Icon name="search" size={18} />
                <input
                  ref={search}
                  type="search"
                  value={query}
                  placeholder={t('common.search')}
                  aria-label={t('common.search')}
                  aria-controls={id}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onSearchKey}
                />
              </label>
            )}
            <ul
              ref={list}
              id={id}
              role="listbox"
              onKeyDown={onKey}
              className="min-h-0 overflow-y-auto p-1.5"
            >
              {shown.length === 0 && (
                <li className="menu-item cursor-default text-muted">
                  {t('common.noMatch', { query: query.trim() })}
                </li>
              )}
              {shown.map(([v, text, lead], i) => (
                <li
                  key={String(v)}
                  role="option"
                  aria-selected={v === value}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => pick(i)}
                  data-active={i === active || undefined}
                  className="menu-item"
                >
                  {lead}
                  <span className="min-w-0 flex-1 truncate">{text}</span>
                  {v === value && (
                    <Icon name="check" size={18} style={{ color: 'var(--accent)' }} />
                  )}
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}
