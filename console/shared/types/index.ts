/**
 * Shared types for the Hackathon Demo
 * Aligned with core SigilNet types
 */

/**
 * Core SigilMetrics from sigilnet/core/types
 * Measures system coherence, entropy, and quantum field properties
 */
export interface SigilMetrics {
  /** Entropy level (0-2+), measures system randomness/disorder */
  entropy: number;
  
  /** Coherence level (0-1), measures system synchronization */
  coherence: number;
  
  /** Phase velocity (optional), measures signal propagation speed */
  phaseVelocity?: number;
  
  /** Signal strength (optional), measures connection quality */
  signalStrength?: number;
  
  /** Trust level (0-1) for validation */
  trustLevel?: number;
  
  /** Latency in milliseconds (optional) */
  latency?: number;
  
  /** Custom metrics (extensible) */
  [key: string]: number | number[] | undefined;
}

export interface LiquidityContext {
  reserveIn: number;
  reserveOut: number;
  totalLiquidity?: number;
  poolId?: string;
}

/**
 * SignalFrame extends SigilMetrics with additional signal processing data
 * Aligned with core sigilnet types for quantum signal analysis
 */
export interface SignalFrame extends SigilMetrics {
  /** Phase angle in radians */
  phase: number;
  
  /** Dominant frequency in Hz */
  dominantHz: number;
  
  /** Harmonic amplitudes at 2x, 3x, 4x fundamental */
  harmonics: number[];
  
  /** Frequency spectrum magnitude */
  magnitude: number[];
}

export interface MockSwapResult {
  in: number;
  out: number;
  efficiency: number;
  signal: SignalFrame;
  slippage: number;
  liquidityRank: string;
  executionPlan: {
    chunks: number;
    chunkSize: number;
    estimatedTime: number;
  };
}

export interface PoolSnapshot {
  poolId: string;
  tokenA: string;
  tokenB: string;
  reserveA: number;
  reserveB: number;
  volume24h: number;
  fee: number;
}

export interface QuoteRequest {
  inputMint: string;
  outputMint: string;
  amount: number;
}

export interface QuoteResponse extends MockSwapResult {
  route: string[];
  timestamp: number;
}




/**
 * Types for Mock Swap Core
 */
export type SwapMode = 'demo' | 'real';

export interface MockSwapConfig {
  mode: SwapMode;
  enableSignalProcessing: boolean;
  enableFieldResonance: boolean;
  quantumMode: boolean;
}

export interface RealTokenConfig {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
  rpcUrl?: string; // Optional custom RPC URL for on-chain data fetching
}

export interface PoolData {
  reserves: LiquidityContext;
  sweepData: SweepPoint[];
  volume24h?: number;
  fee?: number;
}

export interface SweepPoint {
  size: number;
  percent: number;
  liquidity?: LiquidityContext;
}
export type Rotation = "cw"|"ccw";

export type Regime =
  | "stable"
  | "volatile"
  | "anomaly"
  | "burst"
  | "unknown"
  | "market"
  | "ohlc"
  | "sim"
  | "ghost"
  | "decoy";

export type WhirlpoolEvent = {
  id: string;
  startedAt: number;
  endedAt?: number;
  centroidHz: number;
  rotation: Rotation;     // sign of d(phase)/dt
  strength: number;           // composite score
  regime: Regime;
  fieldFrame: RaydiumPoolFieldFrame | SignalFrame | FieldFrame;
  signal: PoolSignalFrame;
  midPrice: number;
  liquidityDepth: number;
  volatility: number;
  stats: { plv: number; peakiness: number; entropy: number; durationMs: number };
  logFile?: string;
  capsule?: QuantumCapsule<ResonantEvent>
  ts: number;
};

export interface QuantumCapsule<T=any> {
  id: string; // UUID, or hash
  epoch?: number;         // Solana epoch number
  block?: number;         // Solana block height
  capsuleType: string;    // 'swap', 'signal', 'reward', etc.
  category?: string;      // Optional: e.g. 'iot', 'game', 'defi', ...
  channel?: string;         // Set on manual run or automation
  parent?: string;        // Optional: Parent capsule id (for traceability)
  ts: number;             // Unix ms timestamp
  latency?: number;
  label?: string;         // Freeform, for UI/CLI output
  src?: string;           // Origin (api, chain, iot, etc)
  data: T;                // The *actual* data (signal packet, swaps, etc)
  tags?: string[];        // Optional: ['simulation', 'live', ...]
  meta?: any;             // Arbitrary key-value
  signature?: string;     // (Optional) for signed capsules
}

export interface EpochPaths {
  epochSlot: string;
  root: string;
  lock: string;
  rewards: string;
  report: string;
  meta: string;
  allocs: string;
  logs: string;
  profile: string;
  sent: string;
  batches: string;
  logsDir: string;
  summaryPath: string;
}

export type SignalTransform = "fft" | "wavelet" | "fft+wavelet" | "none";
export type EventType =
  | "swap"
  | "transfer"
  | "mint"
  | "burn"
  | "signal"
  | "resonance"
  | "intent"
  | "custom"
  | "social"
  | "unknown";
export interface Intent {
  user: string;
  amount: bigint;
  slippage: number;
  action: EventType;
  target: string;
  quote: any;
  spotRate: number;
  step?: bigint;
  epoch?: EpochPaths;
  minCoherence?: number;
  maxEntropy?: number;
  requiredHz?: number;
  params?: any[];
  [key: string]: any;
  // Add as needed: purpose, labels, etc.
}


export type ResonantEvent = {
  origin: string;           // Who/what initiated
  target: string;           // To whom/what
  t: number;                // Timestamp
  resonanceHash: string;
  freq: number;             // Dominant frequency (Hz)
  amp: number;              // Amplitude (intensity)
  phase: number;            // Position in cycle
  harmonics: number[]; // Overtones, complexities, other features, tags, patterns
  noise: number;            // Entropy/static in signal
  intent?: Intent | string;          // Human/external explanation
  resistance?: number;      // Oppositional force (antagonism)
  parallel?: boolean;       // Ran in parallel/series
  collision?: string;       // If action clashed with another
  filters?: string[];       // Signal-processing
  payload?: Record<string,any>;
  signature: string;        // Encrypted if needed

};
export interface Fingerprint {
    harmonicCountAvg: number;
    meanSpacing: number;
    stdSpacing: number;
    skewness: number;
    spacingModeMan: string;
    spacingModes: string[];
}


export type PoolSignalFrame = LightFrame | HeavyFrame;

export type PoolType = "ammV4" | "clmm" | "registry" | "null";
export type PersistenceDiagram = { birth: number; death: number; dim: number };

export type FieldResonance = FieldFrame & {
  type: string;
  harmonics: number[];
  avgPhase: number;
  effs: number[];
  power?: number;
  hzSpread?: number[];
  slipRate?: number;
  agentCount?: number;
  fieldMatrix?: number[][]; // Coupling/Relation strengths
  relations?: FieldRelation[];
  resonanceHash?: string;
  fingerprint?: Fingerprint;
  astro?: AstroOverlay;
  notes?: string;
};

export type FieldFrame = {
  ts: number;
  dominantHz: number; // Hz-equivalent
  amp: number; // normalized
  entropy: number; // 0..1 after your norm
  coherence: number; // 0..1
  regime: Regime;
  orderParam?: {
    R: number;
    Theta: number;
  };
};

// Light = quick only
export type LightFrame = FieldFrame & {
  kind: "light";
};

// Heavy = with full suite extras
export type HeavyFrame = RaydiumPoolFieldFrame & {
  kind: "heavy";
  // FFT raw data (optional)
  fft?: {
    magnitude: Float64Array;
    real: Float64Array;
    imag: Float64Array;
  };

  // QuantumSignalSuite state
  vectorEval?: any; // from suite.evaluateSignalVector
  fieldState?: any; // from computeFieldState

  // TDA backbone
  tda?: PersistenceDiagram[];
};

export type FieldRelation = {
  from: string; // Field ID
  to: string; // Field ID
  coupling: number; // -1 (max repulsion) to +1 (max attraction)
  phaseDiff: number; // Radians, 0 = in phase, pi = opposed
  entropy: number; // How stable is this connection?
  notes?: string;
};

export interface AstroOverlay {
  sunSign: string;
  moonSign: string;
  mercuryRetro?: boolean;
  moonPhase: string;
  solarFlux?: number;
  lat?: number;
  lon?: number;
  raw?: any; // Keep if you want original API responses for deeper research
  // Extend here: venusSign, saturnRx, eclipse, aspects, etc
}

export type RaydiumPoolFieldFrame = FieldResonance & {
  poolId: string; // Raydium pool ID
  poolType: PoolType;

  // On-chain state
  price: number; // midPrice or derived ratio
  reserves: [number, number]; // raw vault balances
  ratio: number; // reserveA / reserveB
  depth: number; // min(reserveA, reserveB)
  fees?: { tradeFeeRate: number; protocolFeeRate?: number };

  // Signal-level metrics
  delta: number; // reserveA - reserveB
  resonanceIndex: number; // coherence * (1 - entropy)

  // FFT raw data (optional)
  fft?: {
    magnitude: Float64Array;
    real: Float64Array;
    imag: Float64Array;
  };

  // QuantumSignalSuite state
  vectorEval?: any; // from suite.evaluateSignalVector
  fieldState?: any; // from computeFieldState

  // TDA backbone
  tda?: PersistenceDiagram[];

  // Forensics / raw
  raw?: any;
};


export interface NCFResponse<TState = unknown, TMetrics = unknown> {
  success: boolean;
  state?: TState;
  metrics?: TMetrics;
  error?: string;
}