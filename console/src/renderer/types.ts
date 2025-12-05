import type { DecisionParams, FieldState } from '@hackathon/mock-swap-core';

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
    quantum: {
      platform: string;
      version: string;
      decide: (signalData: SignalFrame, fieldStateData: FieldState) => Promise<QuantumDecisionResponse>;
      updateParams: (params: Partial<DecisionParams>) => Promise<QuantumParamsResponse>;
      measure: (baseConfidence: number) => Promise<QuantumMeasurementResponse>;
      getStatus: () => Promise<QuantumStatusResponse>;
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

