import { deriveCoherence } from '@sigilnet/fft-legacy';
import {
  ZERO_FIXED_POINT,
  averageFixedPoint,
  compareFixedPoint,
  subtractFixedPoint,
  toFixedPoint,
  fixedPointToBigInt,
} from '@gsknnft/bigint-buffer';

/**
 * Negentropic Coupling Framework - TypeScript Simulation Module
 * Author: gsknnft (SigilNet Core Research)
 * Version: 1.0
 *
 * Quantum-Electron secure implementation with hardened NCF dynamics
 */

export interface Edge {
  source: number;
  target: number;
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

export interface SimulationMetrics {
  negentropy: bigint;
  coherence: bigint;
  velocity: bigint;
  time: number;
}

export interface EdgeMetrics {
  entropy: bigint;
  negentropy: bigint;
  coherence: bigint;
  velocity: bigint;
  policy: 'macro' | 'defensive' | 'balanced';
}

export interface SimulationState {
  nodes: number;
  edges: Edge[];
  time: number;
  meshMetrics: SimulationMetrics;
  edgeMetrics: Map<string, EdgeMetrics>;
  history: SimulationMetrics[];
  scenarioMetadata?: ScenarioMetadata;
}

export interface SimulationScenario {
  nodes: number;
  edges: Edge[];
  distributions: Map<string, number[]>;
  metadata?: ScenarioMetadata;
}

export interface SimulationOptions {
  nodes?: number;
  edges?: number;
  scenario?: SimulationScenario;
}

const MACRO_THRESHOLD = toFixedPoint(0.8);
const DEFENSIVE_THRESHOLD = toFixedPoint(0.3);

export class NCFSimulation {
  private nNodes: number;
  private nEdges: number;
  private edges: Edge[];
  private probabilities: Map<string, number[]>;
  private history: SimulationMetrics[];
  private time: number;
  private scenario?: SimulationScenario;

  constructor(options: SimulationOptions = {}) {
    const { nodes = 5, edges = 10, scenario } = options;
    this.nNodes = nodes;
    this.nEdges = Math.min(edges, nodes * nodes);
    this.edges = [];
    this.probabilities = new Map();
    this.history = [];
    this.time = 0;
    this.scenario = scenario;

    this.initializeMesh();
  }

  private initializeMesh(): void {
    if (this.scenario) {
      this.applyScenario(this.scenario);
      return;
    }

    // Create random directed edges
    const allPossible: Edge[] = [];
    for (let i = 0; i < this.nNodes; i++) {
      for (let j = 0; j < this.nNodes; j++) {
        if (i !== j) {
          allPossible.push({ source: i, target: j });
        }
      }
    }

    // Randomly select edges
    const selectedIndices = new Set<number>();
    while (selectedIndices.size < Math.min(this.nEdges, allPossible.length)) {
      selectedIndices.add(Math.floor(Math.random() * allPossible.length));
    }

    this.edges = Array.from(selectedIndices).map((i) => allPossible[i]);

    // Initialize random probability distributions for each edge
    for (const edge of this.edges) {
      const key = this.edgeKey(edge);
      const probs = Array.from({ length: 10 }, () => Math.random() * 0.9 + 0.1);
      const sum = probs.reduce((a, b) => a + b, 0);
      this.probabilities.set(
        key,
        probs.map((p) => p / sum),
      );
    }

    console.log(
      `Mesh initialized: ${this.nNodes} nodes, ${this.edges.length} edges`,
    );
  }

  private applyScenario(scenario: SimulationScenario): void {
    this.nNodes = scenario.nodes;
    this.edges = scenario.edges;
    this.nEdges = scenario.edges.length;
    this.probabilities.clear();

    for (const [key, probs] of scenario.distributions.entries()) {
      const sum = probs.reduce((a, b) => a + b, 0);
      const normalized = sum > 0 ? probs.map((p) => p / sum) : probs;
      this.probabilities.set(key, normalized);
    }

    console.log(
      `Scenario applied: ${this.nNodes} nodes, ${this.edges.length} edges, ` +
        `${this.probabilities.size} distributions`,
    );
  }

  private edgeKey(edge: Edge): string {
    return `${edge.source}-${edge.target}`;
  }

  private entropyField(edge: Edge): number {
    const key = this.edgeKey(edge);
    const p = this.probabilities.get(key);
    if (!p) return 0.0;

    // Shannon entropy: H = -∑ p log₂ p
    const pNonzero = p.filter((val) => val > 0);
    return -pNonzero.reduce((sum, val) => sum + val * Math.log2(val), 0);
  }

  private hmax(edge: Edge): number {
    const key = this.edgeKey(edge);
    const p = this.probabilities.get(key);
    if (!p) return 1.0;
    return Math.log2(p.length);
  }

  private negentropicIndex(edge: Edge): number {
    const h = this.entropyField(edge);
    const hMax = this.hmax(edge);
    if (hMax === 0) return 0.0;
    return 1.0 - h / hMax;
  }

  private entropyVelocity(): bigint {
    if (this.history.length === 0) {
      return fixedPointToBigInt(ZERO_FIXED_POINT);
    }
    return this.history[this.history.length - 1].velocity ?? fixedPointToBigInt(ZERO_FIXED_POINT);
  }

  private coherence(edge: Edge): number {
    const key = this.edgeKey(edge);
    const samples = this.probabilities.get(key);
    if (!samples || samples.length === 0) {
      return 0;
    }
    try {
      const spectralCoherence = deriveCoherence(Float64Array.from(samples));
      if (!Number.isFinite(spectralCoherence)) {
        return 0;
      }
      return Math.max(0, Math.min(1, spectralCoherence));
    } catch (error) {
      console.warn('Coherence calculation failed', { edge: key, error });
      return 0;
    }
  }

  private policyFromNegentropy(n: string): 'macro' | 'defensive' | 'balanced' {
    if (compareFixedPoint(n, MACRO_THRESHOLD) > 0) return 'macro';
    if (compareFixedPoint(n, DEFENSIVE_THRESHOLD) < 0) return 'defensive';
    return 'balanced';
  }

  private updateDistributions(): void {
    for (const edge of this.edges) {
      const key = this.edgeKey(edge);
      const probs = this.probabilities.get(key);
      if (!probs) continue;

      // Add small random perturbation and renormalize
      const noise = Array.from(
        { length: probs.length },
        () => Math.random() * 0.1,
      );
      const newProbs = probs.map((p, i) => p * 0.9 + noise[i]);
      const sum = newProbs.reduce((a, b) => a + b, 0);
      this.probabilities.set(
        key,
        newProbs.map((p) => p / sum),
      );
    }
  }

  public evolve(): SimulationMetrics {
    const negentropies = this.edges.map((edge) =>
      toFixedPoint(this.negentropicIndex(edge)),
    );
    const coherences = this.edges.map((edge) =>
      toFixedPoint(this.coherence(edge)),
    );

    const avgNegentropy = averageFixedPoint(negentropies);
    const avgCoherence = averageFixedPoint(coherences);

    let avgVelocity = ZERO_FIXED_POINT as string;
    if (this.history.length > 0) {
      avgVelocity = subtractFixedPoint(
        avgNegentropy,
        toFixedPoint(Number(this.history[this.history.length - 1].negentropy)),
      );
    }

    const metrics: SimulationMetrics = {
      negentropy: fixedPointToBigInt(avgNegentropy),
      coherence: fixedPointToBigInt(avgCoherence),
      velocity: fixedPointToBigInt(avgVelocity),
      time: this.time,
    };

    // Log state
    this.history.push(metrics);

    // Update distributions for next step
    this.updateDistributions();
    this.time += 1;

    return metrics;
  }

  public getState(): SimulationState {
    const edgeMetrics = new Map<string, EdgeMetrics>();

    const meshVelocity = this.entropyVelocity();

    for (const edge of this.edges) {
      const key = this.edgeKey(edge);
      const negentropy = toFixedPoint(this.negentropicIndex(edge));
      const coherence = fixedPointToBigInt(toFixedPoint(this.coherence(edge)));
      edgeMetrics.set(key, {
        entropy: fixedPointToBigInt(toFixedPoint(this.entropyField(edge))),
        negentropy: fixedPointToBigInt(negentropy),
        coherence,
        velocity: meshVelocity,
        policy: this.policyFromNegentropy(negentropy),
      });
    }

    const meshMetrics: SimulationMetrics =
      this.history.length > 0
        ? this.history[this.history.length - 1]
        : {
            negentropy: fixedPointToBigInt(ZERO_FIXED_POINT),
            coherence: fixedPointToBigInt(ZERO_FIXED_POINT),
            velocity: fixedPointToBigInt(ZERO_FIXED_POINT),
            time: 0,
          };

    return {
      nodes: this.nNodes,
      edges: this.edges,
      time: this.time,
      meshMetrics,
      edgeMetrics,
      history: this.history,
      scenarioMetadata: this.scenario?.metadata,
    };
  }

  public getHistory(): SimulationMetrics[] {
    return this.history;
  }

  public reset(options: SimulationOptions = {}): void {
    const { nodes, edges } = options;
    if (typeof nodes === 'number') this.nNodes = nodes;
    if (typeof edges === 'number') this.nEdges = edges;
    if ('scenario' in options) {
      this.scenario = options.scenario;
    }
    this.edges = [];
    this.probabilities.clear();
    this.history = [];
    this.time = 0;
    this.initializeMesh();
  }
}
