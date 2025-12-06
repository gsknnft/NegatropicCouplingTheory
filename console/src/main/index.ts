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
import {
  persistScenarioUpload,
  registerScenarioUpload,
} from './uploadStore';

ipcMain.handle(
  'ncf:uploadScenario',
  async (_event, { name, type, data, saveToFile }) => {
    try {
      const buffer = Buffer.from(data);
      const record = registerScenarioUpload(
        name,
        buffer,
        type,
        Boolean(saveToFile),
      );
      if (record.saveToFile) {
        await persistScenarioUpload(record);
      }
      return {
        success: true,
        state: {
          path: record.virtualPath,
          checksum: record.checksum,
          size: record.size,
          name: record.originalName,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
);

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

    console.log('Creating main window...');
    mainWindow = new BrowserWindow({
      show: true, // Force window to show immediately for debugging
    width: 1024,
    height: 728,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false,
    },
  });

  const url = dev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../app/dist/renderer/index.html')}`;

  await mainWindow.loadURL(url);
  
  mainWindow.webContents.reloadIgnoringCache();
  console.log('Main window created, attempting to show...');
  mainWindow.once('ready-to-show', () => {
    console.log('ready-to-show event fired, showing window');
    mainWindow?.show();
  });
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

app.whenReady().then(() => {
  console.log('Electron app is ready, calling createWindow');
  createWindow();
});

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
