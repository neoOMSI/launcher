import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  shell,
  type IpcMainInvokeEvent,
} from 'electron';
import { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { EngineClient } from './client';
import { MockEngineClient } from './mock-client';
import { ProcessEngineClient } from './process-client';
import { loadPrefs, savePrefs } from './prefs';
import type { EngineStatus } from '../src/types/scaffold';
import type { LauncherPrefs, PickKind } from '../src/types/neoomsi';
import {
  COMMANDS,
  type Config,
  type EngineEvent,
  type Instance,
  type Launched,
  type MapInfo,
} from '../src/types/launcher';
import packageJson from '../package.json' with { type: 'json' };

let mainWindow: BrowserWindow | null = null;
let engine: EngineClient | null = null;
let engineError: string | null = null;
let isQuitting = false;

const useMock = () => process.env.NEOOMSI_USE_MOCK === '1' || process.argv.includes('--mock');

const ENGINE = process.platform === 'win32' ? 'neoomsi.exe' : 'neoomsi';

// `pnpm dev:real`: a release build in a neoOMSI checkout beside this one.
function developmentEngine(): string | undefined {
  const candidate = resolve(process.cwd(), '../neoOMSI/target/release', ENGINE);
  return existsSync(candidate) ? candidate : undefined;
}

function bundledEngine(): string | undefined {
  let dir = dirname(process.execPath);
  for (let up = 0; up < 8; up++) {
    for (const candidate of [join(dir, ENGINE), join(dir, 'Contents', 'MacOS', ENGINE)]) {
      if (existsSync(candidate)) return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

function initializeEngineClient(): EngineClient {
  if (useMock()) return new MockEngineClient();

  const enginePath =
    process.argv.find((a) => a.startsWith('--engine='))?.slice('--engine='.length) ||
    process.env.NEOOMSI_ENGINE_PATH ||
    (app.isPackaged ? bundledEngine() : developmentEngine());
  if (!enginePath) {
    throw new Error(
      app.isPackaged
        ? `The game (${ENGINE}) was not found beside the launcher. Start neoOMSI from its own folder.`
        : 'Engine path is not configured. Pass --engine=<neoomsi>, set NEOOMSI_ENGINE_PATH, or run with NEOOMSI_USE_MOCK=1 (or --mock in development).',
    );
  }
  return new ProcessEngineClient({
    enginePath: resolve(enginePath),
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
    engine.on('event', (event: EngineEvent) => {
      mainWindow?.webContents.send('engine:event', event);
      if (event.type === 'instances_changed') watchGames(event.payload);
    });
    engine.on('diagnostic', (log: string) => {
      mainWindow?.webContents.send('engine:diagnostic-log', log);
    });
    engineError = null;
  } catch (err: unknown) {
    engineError = err instanceof Error ? err.message : String(err);
    console.error('Failed to initialize engine client:', engineError);
  }
}

let hiddenForGame = false;
// Games just launched: the launcher stays on screen until their window is up, and stays for
// good when one never comes (it failed to start, and the launcher shows why).
const awaitingWindow = new Set<number>();

function watchGames(instances: Instance[]) {
  for (const pid of awaitingWindow) {
    const game = instances.find((i) => i.pid === pid);
    if (!game || (game.running && !game.link?.window)) continue;
    awaitingWindow.delete(pid);
    if (game.running) stepAside();
  }
  if (!hiddenForGame || instances.some((i) => i.running)) return;
  hiddenForGame = false;
  if (!loadPrefs().restoreOnExit || !mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function stepAside() {
  const { onLaunch } = loadPrefs();
  if (!mainWindow || onLaunch === 'keep') return;
  hiddenForGame = true;
  if (onLaunch === 'hide') mainWindow.hide();
  else mainWindow.minimize();
}

function iconPath() {
  const name = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  const packaged = join(process.resourcesPath, name);
  return existsSync(packaged) ? packaged : join(app.getAppPath(), 'build', name);
}

function createWindow(): void {
  const saved = loadPrefs().window;
  mainWindow = new BrowserWindow({
    width: saved?.width ?? 1320,
    height: saved?.height ?? 840,
    x: saved?.x,
    y: saved?.y,
    minWidth: 1080,
    minHeight: 680,
    title: 'neoOMSI',
    icon: iconPath(),
    backgroundColor: '#0f0f0f',
    titleBarStyle: 'hidden',
    ...(process.platform === 'darwin' ? { trafficLightPosition: { x: 18, y: 16 } } : {}),
    show: false,
    webPreferences: {
      preload: join(import.meta.dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
    },
  });
  if (saved?.maximized) mainWindow.maximize();
  mainWindow.once('ready-to-show', () => mainWindow?.show());

  const sendMaximized = () =>
    mainWindow?.webContents.send('window:maximized', mainWindow.isMaximized());
  mainWindow.on('maximize', sendMaximized);
  mainWindow.on('unmaximize', sendMaximized);
  mainWindow.on('close', () => {
    if (!mainWindow) return;
    savePrefs({ window: { ...mainWindow.getNormalBounds(), maximized: mainWindow.isMaximized() } });
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

function requireEngine(): EngineClient {
  if (!engine) throw new Error(engineError ?? 'Engine client not initialized');
  return engine;
}

registerIpcHandler('engine:get-status', (): EngineStatus => {
  return engine
    ? engine.getStatus()
    : {
        connectionState: 'error',
        capabilities: [],
        lastError: engineError ?? 'Engine client not initialized',
      };
});

registerIpcHandler('engine:start', async () => {
  if (!engine) setupEngineClient();
  return requireEngine().start();
});

registerIpcHandler('engine:stop', async () => {
  if (engine) {
    await engine.stop();
  }
});

registerIpcHandler('engine:call', async (_, command: string, args: unknown) => {
  const client = requireEngine();
  if (!(COMMANDS as readonly string[]).includes(command)) {
    throw new Error(`Unknown launcher command '${command}'`);
  }
  const result = await client.sendRequest(command, args ?? {});
  if (command === 'launch') awaitingWindow.add((result as Launched).pid);
  return result;
});

registerIpcHandler('engine:preview-model', async (_, bus: string, paint: string) => {
  const path = await requireEngine().sendRequest<string>('preview', { bus, paint });
  if (typeof path !== 'string' || !path.toLowerCase().endsWith('.glb')) {
    throw new Error('The engine did not export a model');
  }
  return new Uint8Array(await readFile(path));
});

registerIpcHandler('engine:map-picture', async (_, mapFile: string) => {
  const client = requireEngine();
  const [config, maps] = await Promise.all([
    client.sendRequest<Config>('config', {}),
    client.sendRequest<MapInfo[]>('maps', {}),
  ]);
  const map = maps.find((m) => m.file === mapFile);
  if (!map || !config.root) return null;
  const root = resolve(config.root);
  const picture = resolve(root, dirname(map.file), 'picture.jpg');
  const rel = relative(root, picture);
  if (rel.startsWith('..') || isAbsolute(rel)) return null;
  try {
    return new Uint8Array(await readFile(picture));
  } catch {
    return null;
  }
});

registerIpcHandler('window:minimize', () => mainWindow?.minimize());
registerIpcHandler('window:toggle-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
registerIpcHandler('window:close', () => mainWindow?.close());
registerIpcHandler('window:is-maximized', () => mainWindow?.isMaximized() ?? false);

registerIpcHandler('prefs:get', () => loadPrefs());
registerIpcHandler('prefs:set', (_, patch: Partial<LauncherPrefs>) => savePrefs(patch));

const PICK_FILTERS: Record<PickKind, Electron.FileFilter[]> = {
  mod: [{ name: 'Mods', extensions: ['zip', '7z', 'rar'] }],
  engine: process.platform === 'win32' ? [{ name: 'neoOMSI', extensions: ['exe'] }] : [],
  any: [],
};

registerIpcHandler('dialog:pick-files', async (_, kind: PickKind, multiple: boolean) => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: multiple ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: PICK_FILTERS[kind] ?? [],
  });
  return result.canceled ? [] : result.filePaths;
});

registerIpcHandler('dialog:pick-folder', async (_, defaultPath?: string) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    defaultPath: defaultPath || undefined,
  });
  return result.canceled ? null : result.filePaths[0];
});

const OPENABLE = new Set(['.log', '.txt', '.json', '.toml', '.cfg']);

registerIpcHandler('shell:open-path', async (_, path: string) => {
  if (!existsSync(path)) throw new Error(`${path} does not exist`);
  if (!statSync(path).isDirectory() && !OPENABLE.has(extname(path).toLowerCase())) {
    throw new Error(`${path} cannot be opened from the launcher`);
  }
  const error = await shell.openPath(path);
  if (error) throw new Error(error);
});

registerIpcHandler('shell:show-item', (_, path: string) => {
  if (existsSync(path)) shell.showItemInFolder(path);
});

registerIpcHandler('shell:open-external', (_, url: string) => {
  if (!/^https:\/\//.test(url)) throw new Error('Only https links can be opened');
  return shell.openExternal(url);
});

registerIpcHandler('app:info', () => ({
  version: app.getVersion(),
  electron: process.versions.electron,
  chrome: process.versions.chrome,
  platform: process.platform,
  arch: process.arch,
  userData: app.getPath('userData'),
}));

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
});

app.whenReady().then(() => {
  if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
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
