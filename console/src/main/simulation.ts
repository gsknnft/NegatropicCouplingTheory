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

export interface SimulationMetrics {
  negentropy: number;
  coherence: number;
  velocity: number;
  time: number;
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

export class NCFSimulation {
  private nNodes: number;
  private nEdges: number;
  private edges: Edge[];
  private probabilities: Map<string, number[]>;
  private history: SimulationMetrics[];
  private time: number;

  constructor(nNodes: number = 5, nEdges: number = 10) {
    this.nNodes = nNodes;
    this.nEdges = Math.min(nEdges, nNodes * nNodes);
    this.edges = [];
    this.probabilities = new Map();
    this.history = [];
    this.time = 0;

    this.initializeMesh();
  }

  private initializeMesh(): void {
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
    
    this.edges = Array.from(selectedIndices).map(i => allPossible[i]);

    // Initialize random probability distributions for each edge
    for (const edge of this.edges) {
      const key = this.edgeKey(edge);
      const probs = Array.from({ length: 10 }, () => Math.random() * 0.9 + 0.1);
      const sum = probs.reduce((a, b) => a + b, 0);
      this.probabilities.set(key, probs.map(p => p / sum));
    }

    console.log(`Mesh initialized: ${this.nNodes} nodes, ${this.edges.length} edges`);
  }

  private edgeKey(edge: Edge): string {
    return `${edge.source}-${edge.target}`;
  }

  private entropyField(edge: Edge): number {
    const key = this.edgeKey(edge);
    const p = this.probabilities.get(key);
    if (!p) return 0.0;

    // Shannon entropy: H = -∑ p log₂ p
    const pNonzero = p.filter(val => val > 0);
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

  private entropyVelocity(_edge: Edge): number {
    if (this.history.length < 2) return 0.0;

    // For velocity, we compute change in entropy for this specific edge
    // Simplified: use mesh-level velocity as approximation
    return this.history[this.history.length - 1].velocity;
  }

  private coherence(edge: Edge): number {
    const reverseEdge: Edge = { source: edge.target, target: edge.source };
    
    const h1 = this.entropyField(edge);
    const h2 = this.entropyField(reverseEdge);
    const hmax1 = this.hmax(edge);
    const hmax2 = this.hmax(reverseEdge);

    const k1 = hmax1 > 0 ? h1 / hmax1 : 0;
    const k2 = hmax2 > 0 ? h2 / hmax2 : 0;

    return 1.0 - Math.abs(k1 - k2);
  }

  private policy(edge: Edge): 'macro' | 'defensive' | 'balanced' {
    const n = this.negentropicIndex(edge);
    
    if (n > 0.8) return 'macro';
    if (n < 0.3) return 'defensive';
    return 'balanced';
  }

  private updateDistributions(): void {
    for (const edge of this.edges) {
      const key = this.edgeKey(edge);
      const probs = this.probabilities.get(key);
      if (!probs) continue;

      // Add small random perturbation and renormalize
      const noise = Array.from({ length: probs.length }, () => Math.random() * 0.1);
      const newProbs = probs.map((p, i) => p * 0.9 + noise[i]);
      const sum = newProbs.reduce((a, b) => a + b, 0);
      this.probabilities.set(key, newProbs.map(p => p / sum));
    }
  }

  public evolve(): SimulationMetrics {
    // Compute metrics for all edges
    const negentropies = this.edges.map(e => this.negentropicIndex(e));
    const coherences = this.edges.map(e => this.coherence(e));
    
    // Compute mesh-level averages
    const avgNegentropy = negentropies.reduce((a, b) => a + b, 0) / negentropies.length;
    const avgCoherence = coherences.reduce((a, b) => a + b, 0) / coherences.length;
    
    // Velocity from previous step
    let avgVelocity = 0;
    if (this.history.length > 0) {
      const prevNegentropy = this.history[this.history.length - 1].negentropy;
      avgVelocity = avgNegentropy - prevNegentropy;
    }

    const metrics: SimulationMetrics = {
      negentropy: avgNegentropy,
      coherence: avgCoherence,
      velocity: avgVelocity,
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
    
    for (const edge of this.edges) {
      const key = this.edgeKey(edge);
      edgeMetrics.set(key, {
        entropy: this.entropyField(edge),
        negentropy: this.negentropicIndex(edge),
        coherence: this.coherence(edge),
        velocity: this.entropyVelocity(edge),
        policy: this.policy(edge),
      });
    }

    const meshMetrics: SimulationMetrics = this.history.length > 0
      ? this.history[this.history.length - 1]
      : { negentropy: 0, coherence: 0, velocity: 0, time: 0 };

    return {
      nodes: this.nNodes,
      edges: this.edges,
      time: this.time,
      meshMetrics,
      edgeMetrics,
      history: this.history,
    };
  }

  public getHistory(): SimulationMetrics[] {
    return this.history;
  }

  public reset(nNodes?: number, nEdges?: number): void {
    if (nNodes) this.nNodes = nNodes;
    if (nEdges) this.nEdges = nEdges;
    this.edges = [];
    this.probabilities.clear();
    this.history = [];
    this.time = 0;
    this.initializeMesh();
  }
}
