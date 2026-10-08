// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { setLanguage } from '../i18n';

function Broken(): React.ReactNode {
  throw new Error('installed is undefined');
}

describe('ErrorBoundary', () => {
  beforeEach(() => setLanguage('en'));

  it('shows the error screen instead of a blank window', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByText('This page ran into a problem')).toBeDefined();
    expect(screen.getByText('installed is undefined')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeDefined();
    expect(onError).toHaveBeenCalled();
  });
});
