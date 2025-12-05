import fs from 'node:fs/promises';
import path from 'node:path';
import {
  NCFSimulation,
  SimulationScenario,
  SimulationState,
  SimulationMetrics,
  Edge,
} from '../simulation';

export interface NCFParams {
  steps?: number;
  nodes?: number;
  edges?: number;
  scenarioPath?: string;
}

export interface NCFResponse<T = unknown> {
  success: boolean;
  state?: T;
  metrics?: T;
  error?: string;
}

interface ScenarioFile {
  mesh: {
    nodes: number;
    edges: [number, number][];
  };
  initial_state?: {
    probability_distributions?: Record<string, number[]>;
  };
}

const DEFAULT_SCENARIO = path.resolve(
  process.cwd(),
  'examples/entropy_mesh_example.json',
);

function cloneScenario(scenario: SimulationScenario): SimulationScenario {
  return {
    nodes: scenario.nodes,
    edges: scenario.edges.map((edge) => ({ ...edge })),
    distributions: new Map(
      Array.from(scenario.distributions.entries()).map(([key, values]) => [
        key,
        [...values],
      ]),
    ),
  };
}

export class NCFService {
  private simulation: NCFSimulation;
  private scenarioCache: Map<string, SimulationScenario> = new Map();
  private initialized = false;

  constructor() {
    this.simulation = new NCFSimulation();
  }

  private normalizeEdgeKey(rawKey: string): string {
    const cleaned = rawKey.replace(/\[|\]|\s/g, '');
    const [source, target] = cleaned
      .split(',')
      .map((segment) => Number(segment));
    return `${source}-${target}`;
  }

  private async loadScenario(filePath: string): Promise<SimulationScenario> {
    // Auto-detect file type
    const ext = path.extname(filePath).toLowerCase();
    let buffer: string | Buffer;
    let parsed: any;

    if (filePath.startsWith('uploads/')) {
      // Check in-memory uploads (from main/index.ts)
      const { uploadedScenarios } = require('../main/index');
      const upload = uploadedScenarios.get(path.basename(filePath));
      if (!upload) throw new Error('Uploaded scenario not found');
      buffer = upload.buffer;
    } else {
      buffer = await fs.readFile(
        path.isAbsolute(filePath)
          ? filePath
          : path.resolve(process.cwd(), filePath),
      );
    }

    if (ext === '.json') {
      parsed = JSON.parse(buffer.toString());
      // ...existing JSON parsing logic...
      const edges: Edge[] = parsed.mesh.edges.map(
        ([source, target]: [number, number]) => ({ source, target }),
      );
      const rawDistributions =
        parsed.initial_state?.probability_distributions ?? {};
      const distributions = new Map<string, number[]>();
      for (const [key, values] of Object.entries(rawDistributions)) {
        distributions.set(this.normalizeEdgeKey(key), values as number[]);
      }
      return {
        nodes: parsed.mesh.nodes,
        edges,
        distributions,
      };
    } else if (ext === '.py') {
      // Run Python script and parse output
      const { execSync } = require('child_process');
      const result = execSync(`python`, { input: buffer, encoding: 'utf8' });
      parsed = JSON.parse(result);
      // Assume output matches ScenarioFile shape
      const edges: Edge[] = parsed.mesh.edges.map(
        ([source, target]: [number, number]) => ({ source, target }),
      );
      const rawDistributions =
        parsed.initial_state?.probability_distributions ?? {};
      const distributions = new Map<string, number[]>();
      for (const [key, values] of Object.entries(rawDistributions)) {
        distributions.set(this.normalizeEdgeKey(key), values as number[]);
      }
      return {
        nodes: parsed.mesh.nodes,
        edges,
        distributions,
      };
    } else if (ext === '.wl') {
      // Run Wolfram script and parse output (stub)
      // TODO: Integrate with Wolfram Engine or MathKernel
      throw new Error('Wolfram scenario parsing not yet implemented');
    } else if (ext === '.ipynb') {
      // Parse notebook and extract scenario JSON
      parsed = JSON.parse(buffer.toString());
      // Find first code cell with scenario JSON
      const cell = parsed.cells.find(
        (c: any) =>
          c.cell_type === 'code' &&
          c.source.some((line: string) => line.includes('mesh')),
      );
      if (!cell) throw new Error('No scenario cell found in notebook');
      const scenarioSource = cell.source.join('');
      const scenarioJson = scenarioSource.match(/{[\s\S]*}/);
      if (!scenarioJson) throw new Error('No scenario JSON found in cell');
      const scenario = JSON.parse(scenarioJson[0]);
      const edges: Edge[] = scenario.mesh.edges.map(
        ([source, target]: [number, number]) => ({ source, target }),
      );
      const rawDistributions =
        scenario.initial_state?.probability_distributions ?? {};
      const distributions = new Map<string, number[]>();
      for (const [key, values] of Object.entries(rawDistributions)) {
        distributions.set(this.normalizeEdgeKey(key), values as number[]);
      }
      return {
        nodes: scenario.mesh.nodes,
        edges,
        distributions,
      };
    } else {
      throw new Error('Unsupported scenario file type');
    }
  }

  private async getScenario(filePath?: string): Promise<SimulationScenario> {
    const resolvedPath = filePath
      ? path.resolve(process.cwd(), filePath)
      : DEFAULT_SCENARIO;
    const cached = this.scenarioCache.get(resolvedPath);
    if (cached) {
      return cloneScenario(cached);
    }
    const scenario = await this.loadScenario(resolvedPath);
    this.scenarioCache.set(resolvedPath, scenario);
    return cloneScenario(scenario);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.reset();
    }
  }

  public async run(params: NCFParams = {}): Promise<SimulationState> {
    const scenario = await this.getScenario(params.scenarioPath);
    this.simulation.reset({
      nodes: params.nodes ?? scenario.nodes,
      edges: params.edges ?? scenario.edges.length,
      scenario,
    });
    const steps = Math.max(1, params.steps ?? 1);
    for (let i = 0; i < steps; i++) {
      this.simulation.evolve();
    }
    this.initialized = true;
    return this.simulation.getState();
  }

  public async step(): Promise<SimulationMetrics> {
    await this.ensureInitialized();
    return this.simulation.evolve();
  }

  public async getState(): Promise<SimulationState> {
    await this.ensureInitialized();
    return this.simulation.getState();
  }

  public async reset(params: NCFParams = {}): Promise<SimulationState> {
    const scenario = await this.getScenario(params.scenarioPath);
    this.simulation.reset({
      nodes: params.nodes ?? scenario.nodes,
      edges: params.edges ?? scenario.edges.length,
      scenario,
    });
    const primeSteps = Math.max(1, params.steps ?? 1);
    for (let i = 0; i < primeSteps; i++) {
      this.simulation.evolve();
    }
    this.initialized = true;
    return this.simulation.getState();
  }
}

export const ncfService = new NCFService();
