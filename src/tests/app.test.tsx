// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { App } from '../App';
import { setLanguage } from '../i18n';

describe('neoOMSI Launcher UI Shell', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  it('renders sidebar navigation with Launch, Content, Settings, and Diagnostics', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Launch' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Content' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Diagnostics' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Status' })).toBeNull();
  });
});
