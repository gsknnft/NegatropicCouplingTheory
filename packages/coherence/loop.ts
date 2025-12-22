export type Margin = number;   // [0,1]
export type Drift = number;    // dM/dt (units per second)
export type Reserve = number;  // [0,1]

export interface Sample {
  t: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errRate: number;
  queueDepth: number;
  queueSlope: number;
  corrSpike?: number;
}

export interface CouplingParams {
  batchSize: number;
  concurrency: number;
  redundancy: number;
  paceMs: number;
}

export interface CoherenceState {
  M: Margin;
  V: Drift;
  R: Reserve;
  H: number;
}

export interface CoherenceConfig {
  Hmin: number;
  maxDelta: Partial<CouplingParams>;
  floors: Partial<CouplingParams>;
  ceilings: Partial<CouplingParams>;
}

export class CoherenceLoop {
  private history: Sample[] = [];
  constructor(private cfg: CoherenceConfig, private historySize = 64) {}

  sense(sample: Sample) {
    this.history.push(sample);
    if (this.history.length > this.historySize) this.history.shift();
  }

  estimate(): CoherenceState {
    const n = this.history.length;
    if (n < 2) return { M: 1, V: 0, R: 1, H: Infinity };

    const a = this.history[n - 2];
    const b = this.history[n - 1];
    const dt = Math.max(1e-6, (b.t - a.t) / 1000);

    const tail = Math.max(0, b.latencyP99 - b.latencyP50);
    const err = b.errRate;
    const M = clamp01(1 / (1 + 0.05 * tail + 50 * err));

    const prevTail = Math.max(0, a.latencyP99 - a.latencyP50);
    const prevM = clamp01(1 / (1 + 0.05 * prevTail + 50 * a.errRate));
    const V = (M - prevM) / dt;

    const heat = Math.max(0, b.queueSlope) + (b.corrSpike ?? 0);
    const R = clamp01(1 / (1 + 2 * heat));

    const H = V < 0 ? (M / Math.max(1e-6, Math.abs(V))) * Math.max(0.2, R) : Infinity;

    return { M, V, R, H };
  }

  adapt(state: CoherenceState, c: CouplingParams): CouplingParams {
    let next = { ...c };

    if (state.H < this.cfg.Hmin) {
      next.batchSize = Math.max(1, Math.floor(next.batchSize / 2));
      next.concurrency = Math.max(1, Math.floor(next.concurrency / 2));
      next.redundancy = next.redundancy + 0.1;
      next.paceMs = next.paceMs + 5;
    }

    next = damp(c, next, this.cfg.maxDelta);
    next = bound(next, this.cfg.floors, this.cfg.ceilings);
    return next;
  }
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function damp(
  prev: CouplingParams,
  next: CouplingParams,
  maxDelta: Partial<CouplingParams>,
) {
  const out = { ...next };
  for (const k of Object.keys(maxDelta) as (keyof CouplingParams)[]) {
    const d = (next[k] as number) - (prev[k] as number);
    const lim = maxDelta[k] as number;
    if (Math.abs(d) > lim) out[k] = (prev[k] as number) + Math.sign(d) * lim;
  }
  return out;
}

function bound(
  x: CouplingParams,
  floors: Partial<CouplingParams>,
  ceilings: Partial<CouplingParams>,
) {
  const out = { ...x };
  for (const k of Object.keys(out) as (keyof CouplingParams)[]) {
    const v = out[k] as number;
    const f = floors[k] as number | undefined;
    const c = ceilings[k] as number | undefined;
    out[k] = f !== undefined ? Math.max(f, v) : v;
    out[k] = c !== undefined ? Math.min(c, out[k] as number) : out[k];
  }
  return out;
}
