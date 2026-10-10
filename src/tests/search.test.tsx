// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Select } from '../components/Select';
import { filterBy, needle } from '../lib/search';

describe('filterBy', () => {
  const rows = [
    { map: 'Grundorf', bus: 'MAN SD202', line: '92' },
    { map: 'Spandau', bus: 'MAN NL202', line: 'M37' },
    { map: 'Berlin', bus: 'Citaro', line: undefined },
  ];
  const fields = (r: (typeof rows)[number]) => [r.map, r.bus, r.line];

  it('keeps everything for an empty or blank query', () => {
    expect(filterBy(rows, '', fields)).toEqual(rows);
    expect(filterBy(rows, '   ', fields)).toEqual(rows);
  });

  it('matches any field, ignoring case and surrounding spaces', () => {
    expect(filterBy(rows, '  man ', fields).map((r) => r.map)).toEqual(['Grundorf', 'Spandau']);
    expect(filterBy(rows, 'm37', fields).map((r) => r.map)).toEqual(['Spandau']);
    expect(filterBy(rows, 'BERLIN', fields).map((r) => r.map)).toEqual(['Berlin']);
  });

  it('skips missing fields and returns nothing when nothing matches', () => {
    expect(filterBy(rows, 'undefined', fields)).toEqual([]);
    expect(filterBy(rows, 'Ikarus', fields)).toEqual([]);
  });

  it('returns a copy, not the input array', () => {
    const out = filterBy(rows, '', fields);
    expect(out).not.toBe(rows);
  });

  it('normalises the query', () => {
    expect(needle('  Hof ')).toBe('hof');
  });
});

describe('Select search', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(cleanup);

  const many = Array.from({ length: 20 }, (_, i) => [`v${i}`, `Option ${i}`] as const);

  it('has no search for short option lists', () => {
    render(<Select value="v0" options={many.slice(0, 5)} onChange={() => {}} />);
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getAllByRole('option')).toHaveLength(5);
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('filters long option lists and picks with the keyboard', () => {
    const onChange = vi.fn();
    render(<Select value="v0" options={many} onChange={onChange} />);
    fireEvent.click(screen.getByRole('combobox'));
    const search = screen.getByRole('searchbox');
    expect(document.activeElement).toBe(search);

    fireEvent.change(search, { target: { value: 'option 1' } });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Option 1',
      ...Array.from({ length: 10 }, (_, i) => `Option 1${i}`),
    ]);
    expect(screen.getByRole('listbox')).toBeTruthy();

    fireEvent.keyDown(search, { key: 'ArrowDown' });
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('v10');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('shows a message when nothing matches and closes on Escape', () => {
    const onChange = vi.fn();
    render(<Select value="v0" options={many} onChange={onChange} />);
    fireEvent.click(screen.getByRole('combobox'));
    const search = screen.getByRole('searchbox');
    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByRole('listbox').textContent).toContain('zzz');
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(search, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('combobox'));
  });

  it('stays open when the menu itself scrolls, closes when the page scrolls', () => {
    render(<Select value="v0" options={many} onChange={() => {}} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.scroll(screen.getByRole('listbox'));
    fireEvent.scroll(screen.getByRole('searchbox'));
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.scroll(document);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
