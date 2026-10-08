// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Tooltips } from '../components/Tooltip';

describe('Tooltips', () => {
  afterEach(() => vi.useRealTimers());

  it('replaces the native title with its own bubble', () => {
    vi.useFakeTimers();
    render(
      <>
        <button type="button" title="Copy code" />
        <Tooltips />
      </>,
    );
    const button = screen.getByRole('button');
    fireEvent.pointerOver(button, { pointerType: 'mouse' });
    expect(button.hasAttribute('title')).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Copy code');
    expect(screen.queryByRole('tooltip')).toBeNull();
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByRole('tooltip').textContent).toBe('Copy code');
    fireEvent.pointerDown(button);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
