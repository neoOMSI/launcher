// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { act, render } from '@testing-library/react';
import { EngineProvider, useEngine, useLogs } from '../lib/engine';

describe('Engine logs', () => {
  it('keep the newest lines and do not re-render the rest of the app', () => {
    let engineRenders = 0;
    let log: (line: string) => void = () => {};
    let logs: string[] = [];
    function Page() {
      engineRenders++;
      log = useEngine().log;
      return null;
    }
    function Diagnostics() {
      logs = useLogs().logs;
      return null;
    }
    render(
      <EngineProvider>
        <Page />
        <Diagnostics />
      </EngineProvider>,
    );
    const before = engineRenders;
    act(() => {
      for (let i = 0; i < 2500; i++) log(`line ${i}`);
    });
    expect(logs).toHaveLength(2000);
    expect(logs.at(-1)).toBe('line 2499');
    expect(engineRenders).toBe(before);
  });
});
