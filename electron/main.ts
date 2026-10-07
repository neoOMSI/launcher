import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { EngineClient } from './client';
import { MockEngineClient } from './mock-client';
import { ProcessEngineClient } from './process-client';
import type { EngineStatus, SessionEvent } from '../src/types/scaffold';
import packageJson from '../package.json' with { type: 'json' };

let mainWindow: BrowserWindow | null = null;
let engine: EngineClient | null = null;
let isQuitting = false;

function initializeEngineClient(): EngineClient {
  const useMock = process.env.NEOOMSI_USE_MOCK === '1' || process.argv.includes('--mock');

  if (useMock) {
    return new MockEngineClient();
  }

  const enginePath = process.env.NEOOMSI_ENGINE_PATH;
  if (!enginePath) {
    throw new Error(
      'Engine path is not configured. Set NEOOMSI_ENGINE_PATH or run with NEOOMSI_USE_MOCK=1 (or --mock in development).',
    );
  }

  return new ProcessEngineClient({
    enginePath,
    launcherVersion: packageJson.version,
  });
}

function setupEngineClient(): void {
  if (engine) return;

  try {
    engine = initializeEngineClient();
    engine.on('status', (status: EngineStatus) => {
      mainWindow?.webContents.send('engine:status-changed', status);
    });
    engine.on('session_event', (event: SessionEvent) => {
      mainWindow?.webContents.send('engine:session-event', event);
    });
    engine.on('diagnostic', (log: string) => {
      mainWindow?.webContents.send('engine:diagnostic-log', log);
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Failed to initialize engine client:', message);
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 800,
    minHeight: 600,
    title: 'neoOMSI Launcher',
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: join(import.meta.dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Renderer navigation stays confined to the launcher window.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    const currentUrl = mainWindow?.webContents.getURL();
    if (currentUrl && targetUrl !== currentUrl) {
      event.preventDefault();
    }
  });

  const isDev = process.argv.includes('--dev') || !!process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
  } else {
    mainWindow.loadFile(join(import.meta.dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Only accept IPC from the launcher's main frame.
function validateSender(event: IpcMainInvokeEvent): void {
  if (!mainWindow || event.senderFrame !== mainWindow.webContents.mainFrame) {
    throw new Error('Unauthorized IPC invocation: unexpected sender frame');
  }

  const frameUrl = event.senderFrame.url;
  const isDev = process.argv.includes('--dev') || !!process.env.VITE_DEV_SERVER_URL;

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    const expectedOrigin = new URL(devServerUrl).origin;
    if (event.senderFrame.origin !== expectedOrigin && !frameUrl.startsWith(devServerUrl)) {
      throw new Error(`Unauthorized IPC invocation: unexpected dev origin '${frameUrl}'`);
    }
  } else {
    const expectedFileUrl = pathToFileURL(join(import.meta.dirname, '../dist/index.html')).href;
    if (frameUrl !== expectedFileUrl) {
      throw new Error(`Unauthorized IPC invocation: unexpected production URL '${frameUrl}'`);
    }
  }
}

function registerIpcHandler<T, TArgs extends unknown[] = unknown[]>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: TArgs) => Promise<T> | T,
): void {
  ipcMain.handle(channel, (event, ...args: unknown[]) => {
    validateSender(event);
    return handler(event, ...(args as TArgs));
  });
}

registerIpcHandler('engine:get-status', () => {
  return engine
    ? engine.getStatus()
    : {
        connectionState: 'error',
        capabilities: [],
        lastError: 'Engine client not initialized',
      };
});

registerIpcHandler('engine:start', async () => {
  if (!engine) {
    setupEngineClient();
  }
  if (!engine) {
    throw new Error('Engine client could not be initialized');
  }
  return engine.start();
});

registerIpcHandler('engine:stop', async () => {
  if (engine) {
    await engine.stop();
  }
});

registerIpcHandler('engine:get-maps', (_, filter: string | undefined) => {
  if (!engine) throw new Error('Engine client not initialized');
  return engine.sendRequest('get_maps', { filter });
});

registerIpcHandler('engine:get-vehicles', (_, filter: string | undefined) => {
  if (!engine) throw new Error('Engine client not initialized');
  return engine.sendRequest('get_vehicles', { filter });
});

registerIpcHandler('engine:get-settings', () => {
  if (!engine) throw new Error('Engine client not initialized');
  return engine.sendRequest('get_settings', {});
});

registerIpcHandler('engine:update-settings', (_, settingsJson: string) => {
  if (!engine) throw new Error('Engine client not initialized');
  return engine.sendRequest('update_settings', { settingsJson });
});

registerIpcHandler('engine:start-session', (_, req: unknown) => {
  if (!engine) throw new Error('Engine client not initialized');
  return engine.sendRequest('start_session', req);
});

registerIpcHandler('engine:stop-session', (_, sessionId: string) => {
  if (!engine) throw new Error('Engine client not initialized');
  return engine.sendRequest('stop_session', { sessionId });
});

app.whenReady().then(() => {
  setupEngineClient();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  if (isQuitting || !engine) {
    return;
  }
  event.preventDefault();
  isQuitting = true;

  (async () => {
    try {
      await engine.stop();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to cleanly stop engine on quit:', message);
    } finally {
      app.quit();
    }
  })();
});
