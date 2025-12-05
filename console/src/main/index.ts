import fs from 'node:fs';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import path from 'node:path';
import log from 'electron-log/main';
import { autoUpdater } from 'electron-updater';
import sourceMapSupport from 'source-map-support';
import {
  default as electronDevtoolsInstaller,
  REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer';
import { ncfService, NCFParams, NCFResponse } from './services/ncfService';

// In-memory scenario store
const uploadedScenarios = new Map<string, { buffer: Buffer; type: string; saveToFile: boolean }>();
ipcMain.handle('ncf:uploadScenario', async (_event, { name, type, data, saveToFile }) => {
  try {
    const buffer = Buffer.from(data);
    uploadedScenarios.set(name, { buffer, type, saveToFile });
    if (saveToFile) {
      const dest = path.resolve(process.cwd(), 'uploads', name);
      await fs.promises.mkdir(path.dirname(dest), { recursive: true });
      await fs.promises.writeFile(dest, buffer);
      return { success: true, path: dest };
    }
    return { success: true, name };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  sourceMapSupport.install();
}

async function installExtensions() {
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  await electronDevtoolsInstaller([REACT_DEVELOPER_TOOLS], { forceDownload });
}

async function createWindow() {
  const dev = true; // !app.isPackaged;

  if (dev) await installExtensions();

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: path.join(process.cwd(), 'assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index'),
      contextIsolation: true,
      sandbox: false,
    },
  });

  const url = dev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../app/dist/renderer/index.html')}`;

  await mainWindow.loadURL(url);
  mainWindow.webContents.reloadIgnoringCache();
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => (mainWindow = null));
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  new AppUpdater();
}

class AppUpdater {
  constructor() {
    if (log.transports?.file) {
      log.transports.file.level = 'info';
    }
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function registerNCFHandlers() {
  const success = <T extends keyof Pick<NCFResponse, 'state' | 'metrics'>>(
    key: T,
    payload: NonNullable<NCFResponse[T]>,
  ): NCFResponse => ({ success: true, [key]: payload });

  const failure = (error: unknown): NCFResponse => ({
    success: false,
    error: error instanceof Error ? error.message : 'Unknown simulation error',
  });

  ipcMain.handle('ncf:run', async (_event, params: NCFParams = {}) => {
    try {
      const state = await ncfService.run(params);
      return success('state', state);
    } catch (error) {
      return failure(error);
    }
  });

  ipcMain.handle('ncf:step', async () => {
    try {
      const metrics = await ncfService.step();
      return success('metrics', metrics);
    } catch (error) {
      return failure(error);
    }
  });

  ipcMain.handle('ncf:state', async () => {
    try {
      const state = await ncfService.getState();
      return success('state', state);
    } catch (error) {
      return failure(error);
    }
  });

  ipcMain.handle('ncf:reset', async (_event, params: NCFParams = {}) => {
    try {
      const state = await ncfService.reset(params);
      return success('state', state);
    } catch (error) {
      return failure(error);
    }
  });
}

registerNCFHandlers();

ipcMain.handle('ping', () => 'pong');
