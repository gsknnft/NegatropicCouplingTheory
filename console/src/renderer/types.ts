export interface NCFParams {
  steps?: number;
  mode?: 'macro' | 'defensive' | 'balanced';
  nodes?: number;
  edges?: number;
}

export interface SimulationMetrics {
  negentropy: number;
  coherence: number;
  velocity: number;
  time: number;
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

export interface SimulationState {
  nodes: number;
  edges: Edge[];
  time: number;
  meshMetrics: SimulationMetrics;
  edgeMetrics: Map<string, EdgeMetrics>;
  history: SimulationMetrics[];
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
    };
  }
}

