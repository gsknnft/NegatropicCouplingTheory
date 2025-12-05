import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { NCFSimulation } from './simulation';

let mainWindow: BrowserWindow | null = null;
let simulation: NCFSimulation | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    title: 'Negentropic Console - Quantum Electron',
    backgroundColor: '#0a0a0a',
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for NCF simulation
ipcMain.handle('ncf:run', async (_event, params) => {
  try {
    const { nodes = 5, edges = 10 } = params || {};
    
    if (!simulation) {
      simulation = new NCFSimulation(nodes, edges);
    }
    
    // Run simulation and return initial state
    const state = simulation.getState();
    return { success: true, state };
  } catch (error) {
    console.error('NCF simulation error:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('ncf:step', async () => {
  try {
    if (!simulation) {
      simulation = new NCFSimulation(5, 10);
    }
    
    const metrics = simulation.evolve();
    return { success: true, metrics };
  } catch (error) {
    console.error('NCF step error:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('ncf:state', async () => {
  try {
    if (!simulation) {
      simulation = new NCFSimulation(5, 10);
    }
    
    const state = simulation.getState();
    return { success: true, state };
  } catch (error) {
    console.error('NCF state error:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('ncf:reset', async (_event, params) => {
  try {
    const { nodes = 5, edges = 10 } = params || {};
    simulation = new NCFSimulation(nodes, edges);
    const state = simulation.getState();
    return { success: true, state };
  } catch (error) {
    console.error('NCF reset error:', error);
    return { success: false, error: String(error) };
  }
});

// App lifecycle
app.whenReady().then(() => {
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
