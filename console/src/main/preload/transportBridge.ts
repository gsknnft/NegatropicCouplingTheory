import { contextBridge, ipcRenderer } from 'electron';
import { QWormholeBenchSummary } from '../services/transportBench';

contextBridge.exposeInMainWorld('transportBench', {
  runBench: async (mode: string = 'all'): Promise<QWormholeBenchSummary> => {
    return ipcRenderer.invoke('transport-bench:run', mode);
  },
});
