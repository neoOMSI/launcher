// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { App } from '../App';
import { setLanguage } from '../i18n';

describe('neoOMSI Launcher shell', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  it('renders the grouped rail', () => {
    render(<App />);
    for (const name of [
      'Drive',
      'Multiplayer',
      'Tutorials',
      'Mods',
      'Timetables',
      'Profile',
      'Settings',
      'Controls',
    ]) {
      expect(screen.getByRole('button', { name })).toBeDefined();
    }
    expect(screen.queryByRole('button', { name: 'Diagnostics' })).toBeNull();
  });
});
