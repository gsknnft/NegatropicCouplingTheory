export type NCFMode = 'macro' | 'defensive' | 'balanced';

export interface SignalData {
  coherence: number[];
  negentropy: number[];
  fieldState: string[];
}

export interface NCFDiagnostics {
  getHistory: (steps?: number) => Promise<NCFResponse<SimulationMetrics[]>>;
  exportCSV: () => Promise<NCFResponse<string>>;
  getHealth: () => Promise<NCFResponse<{ cpu: number; memory: number }>>;
}


export interface NCFParams {
  steps?: number;
  mode?: 'macro' | 'defensive' | 'balanced';
  nodes?: number;
  edges?: number;
  scenarioPath?: string;
}

export interface SimulationMetrics {
  negentropy: number;
  coherence: number;
  velocity: number;
  time: number;

  /** Derived / optional metrics for visualization */
  entropy?: number;        // H = 1 - N (or measured directly)
  throughput?: number;     // Data rate through the system
  flowRate?: number;       // Alias for throughput (compatibility)
  fieldState?: 'macro' | 'balanced' | 'defensive';
}

export interface Edge {
  source: number;
  target: number;
}

export interface EdgeMetrics {
  entropy: number;
  negentropy: number;
  coherence: number;
  velocity: number;
  policy: 'macro' | 'defensive' | 'balanced';
}

export interface ScenarioMetadata {
  name?: string;
  description?: string;
  author?: string;
  version?: string;
  date?: string;
  parameters?: Record<string, unknown>;
  sourcePath?: string;
  format?: string;
  checksum?: string;
  sizeBytes?: number;
  uploadedAt?: string;
  sourceName?: string;
}

export interface SimulationState {
  nodes: number;
  edges: Edge[];
  time: number;
  meshMetrics: SimulationMetrics;
  edgeMetrics: Map<string, EdgeMetrics>;
  history: SimulationMetrics[];
  scenarioMetadata?: ScenarioMetadata;
  anomalies?: AnomalyDetection[];
}

export interface AnomalyDetection {
  timestamp: number;
  type: 'classical' | 'negentropic';
  severity: 'low' | 'medium' | 'high';
  description: string;
}


export interface NCFResponse<T = any> {
  success: boolean;
  state?: T;
  metrics?: T;
  error?: string;
}

declare global {
  interface Window {
    ncf: {
      runSimulation: (params: NCFParams) => Promise<NCFResponse<SimulationState>>;
      step: () => Promise<NCFResponse<SimulationMetrics>>;
      getState: () => Promise<NCFResponse<SimulationState>>;
      reset: (params: NCFParams) => Promise<NCFResponse<SimulationState>>;
      uploadScenario: (payload: { name: string; type: string; data: ArrayBuffer; saveToFile?: boolean }) => Promise<NCFResponse<{ path?: string; name?: string; checksum?: string; size?: number }>>;
    } & NCFDiagnostics;
    quantum: {
      platform: string;
      version: string;
      decide: (signalData: any, fieldStateData: any) => Promise<any>;
      updateParams: (params: Partial<any>) => Promise<any>;
      measure: (baseConfidence: number) => Promise<any>;
      getStatus: () => Promise<any>;
      getMetrics: () => Promise<any>;
      getErrors: () => Promise<any>;
      getHealth: () => Promise<any>;
      getHistory: (count?: number) => Promise<any[]>;
      getHistoryStats: () => Promise<any>;
      exportHistory: (count?: number) => Promise<string>;
      clearHistory: () => Promise<{ success: boolean }>;
    };
  }
}
