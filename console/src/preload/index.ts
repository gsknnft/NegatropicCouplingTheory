import { contextBridge, ipcRenderer } from 'electron';

export interface NCFParams {
  steps?: number;
  mode?: 'macro' | 'defensive' | 'balanced';
  nodes?: number;
  edges?: number;
}

export interface NCFResponse<T = any> {
  success: boolean;
  state?: T;
  metrics?: T;
  error?: string;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('ncf', {
  runSimulation: (params: NCFParams) => 
    ipcRenderer.invoke('ncf:run', params) as Promise<NCFResponse>,
  
  step: () => 
    ipcRenderer.invoke('ncf:step') as Promise<NCFResponse>,
  
  getState: () => 
    ipcRenderer.invoke('ncf:state') as Promise<NCFResponse>,
  
  reset: (params: NCFParams) => 
    ipcRenderer.invoke('ncf:reset', params) as Promise<NCFResponse>,
});

console.log('Preload script loaded with secure context isolation');
