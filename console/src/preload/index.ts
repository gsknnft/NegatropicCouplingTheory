import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export interface NCFParams {
  steps?: number;
  mode?: 'macro' | 'defensive' | 'balanced';
  nodes?: number;
  edges?: number;
  scenarioPath?: string;
}

export interface NCFResponse<TState = unknown, TMetrics = unknown> {
  success: boolean;
  state?: TState;
  metrics?: TMetrics;
  error?: string;
}
export type Channels =
  | 'ipc-example'
  | 'ncf:run'
  | 'ncf:step'
  | 'ncf:state'
  | 'ncf:reset'
  | 'ping';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('ncf', {
  ping: () => ipcRenderer.invoke('ping'),
  platform: process.platform,
  ipcRenderer: {
    sendMessage: (channel: Channels, args: unknown[]) =>
      ipcRenderer.send(channel, ...args),
    on: (channel: Channels, func: (...args: unknown[]) => void) => {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once: (channel: Channels, func: (...args: unknown[]) => void) =>
      ipcRenderer.once(channel, (_event, ...args) => func(...args)),
    ipc: {
      channel: 'ipc-example',
      event: {} as any,
      get: (...args: any[]) => ipcRenderer.invoke('ipc-example', ...args),
    },
  },
  runSimulation: (params: NCFParams) =>
    ipcRenderer.invoke('ncf:run', params) as Promise<NCFResponse>,

  step: () => ipcRenderer.invoke('ncf:step') as Promise<NCFResponse>,

  getState: () => ipcRenderer.invoke('ncf:state') as Promise<NCFResponse>,

  reset: (params: NCFParams) =>
    ipcRenderer.invoke('ncf:reset', params) as Promise<NCFResponse>,
});

console.log('Preload script loaded with secure context isolation');
