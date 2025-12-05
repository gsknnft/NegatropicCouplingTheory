import React, { useState, useEffect } from 'react';
import { SimulationState, EdgeMetrics } from './types';
import { EntropyField } from './components/EntropyField';
import { NegentropyGauge } from './components/NegentropyGauge';
import { CouplingMap } from './components/CouplingMap';
import { PolicyConsole } from './components/PolicyConsole';
import './styles/theme.css';
import { ClassicalVsNegentropic } from './components/ClassicalVsNegentropic';

type EdgeMetricPayload =
  | Map<string, EdgeMetrics>
  | Array<[string, EdgeMetrics]>
  | Record<string, EdgeMetrics>
  | undefined
  | null;

const normalizeState = (raw: SimulationState): SimulationState => {
  const maybeEdgeMetrics = (raw as SimulationState & {
    edgeMetrics: EdgeMetricPayload;
  }).edgeMetrics;

  const normalizedEdgeMetrics =
    maybeEdgeMetrics instanceof Map
      ? maybeEdgeMetrics
      : Array.isArray(maybeEdgeMetrics)
        ? new Map(maybeEdgeMetrics as [string, EdgeMetrics][])
        : new Map(
            Object.entries(
              (maybeEdgeMetrics ?? {}) as Record<string, EdgeMetrics>,
            ) as [string, EdgeMetrics][],
          );

  return {
    ...raw,
    edgeMetrics: normalizedEdgeMetrics,
  };
};

export const App: React.FC = () => {
  const [state, setState] = useState<SimulationState | null>(null);
  const [scenarioPath, setScenarioPath] = useState<string>('examples/entropy_mesh_example.json');
  const [availableScenarios, setAvailableScenarios] = useState([
    { label: 'Entropy Mesh Example', value: 'examples/entropy_mesh_example.json' },
    { label: 'NCF Python Model', value: 'models/NCF_simulation.py' },
    { label: 'NCF Wolfram Model', value: 'models/NCF_simulation.wl' },
    { label: 'Run Simulation Notebook', value: 'examples/run_simulation.ipynb' },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const virtualPath = `uploads/${file.name}`;
      setAvailableScenarios(prev => [
        ...prev,
        { label: `Uploaded: ${file.name}`, value: virtualPath }
      ]);
      setScenarioPath(virtualPath);
      // TODO: send file to backend for processing
    }
  };
  const [autoDemo, setAutoDemo] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  // const [mode, setMode] = useState<'demo' | 'real'>('demo');
  // const [quantumMode, setQuantumMode] = useState(true);
  // const [viewMode, setViewMode] = useState<'swap' | 'comparison' | 'diagnostics'>('swap');
  // const [quantumStatus, setQuantumStatus] = useState<{ initialized: boolean }>({ initialized: false });
  // const [comparisonData, setComparisonData] = useState({
  //   data: [] as any[],
  //   signalData: {
  //     coherence: [] as number[],
  //     entropy: [] as number[],
  //     fieldState: [] as string[],
  //   },
  //   anomalies: [] as any[],
  // });

  // Check quantum adapter status on mount
  // useEffect(() => {
  //   if (window.quantum) {
  //     window.quantum.getStatus().then(status => {
  //       setQuantumStatus(status);
  //     });
  //   }
  // }, []);
  // Initialize simulation on mount
  useEffect(() => {
    initializeSimulation();
  }, [scenarioPath]);

  // Auto-demo mode
  useEffect(() => {
    if (autoDemo && !intervalId) {
      const id = setInterval(() => {
        stepSimulation();
      }, 100);
      setIntervalId(id);
    } else if (!autoDemo && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoDemo, intervalId]);

  const initializeSimulation = async () => {
    try {
      const response = await window.ncf.runSimulation({ nodes: 5, edges: 10, scenarioPath });
      if (response.success && response.state) {
        setState(normalizeState(response.state as SimulationState));
      }
    } catch (error) {
      console.error('Failed to initialize simulation:', error);
    }
  };

  const stepSimulation = async () => {
    try {
      const response = await window.ncf.step();
      if (response.success) {
        // Get updated state
        const stateResponse = await window.ncf.getState();
        if (stateResponse.success && stateResponse.state) {
          setState(normalizeState(stateResponse.state as SimulationState));
        }
      }
    } catch (error) {
      console.error('Failed to step simulation:', error);
    }
  };

  const handleReset = async () => {
    try {
      setAutoDemo(false);
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      const response = await window.ncf.reset({ nodes: 5, edges: 10, scenarioPath });
      if (response.success && response.state) {
        setState(normalizeState(response.state as SimulationState));
      }
    } catch (error) {
      console.error('Failed to reset simulation:', error);
    }
  };

  const toggleAutoDemo = () => {
    setAutoDemo(!autoDemo);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧩 Negentropic Console</h1>
        <p className="subtitle">Real-time Visualization of the Negentropic Coupling Framework</p>
      </header>

      <div className="controls">
        <select
          value={scenarioPath}
          onChange={e => setScenarioPath(e.target.value)}
          style={{ marginRight: 16 }}
        >
          {availableScenarios.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <input
          type="file"
          accept=".json,.py,.wl,.ipynb"
          style={{ marginRight: 16 }}
          onChange={handleFileUpload}
        />
        <button onClick={stepSimulation} disabled={autoDemo}>
          Step Simulation
        </button>
        <button onClick={toggleAutoDemo} className={autoDemo ? 'active' : ''}>
          {autoDemo ? '⏸ Pause Demo' : '▶ Auto Demo'}
        </button>
        <button onClick={handleReset}>
          🔄 Reset
        </button>
        <div className="status">
          {state && (
            <>
              <span>Time: {state.time}</span>
              <span>Nodes: {state.nodes}</span>
              <span>Edges: {state.edges.length}</span>
            </>
          )}
        </div>
      </div>
      <div className="panel panel-large">
        <h2>Classical vs Negentropic</h2>
        {state && (
          <ClassicalVsNegentropic
            data={state.history.map(h => ({
              timestamp: h.time,
              throughput: h.throughput ?? h.flowRate ?? h.velocity * 100,
              entropy: h.entropy ?? (1 - h.negentropy),
            }))}
            signalData={{
              coherence: state.history.map(h => h.coherence),
              negentropy: state.history.map(h => h.negentropy),
              fieldState: state.history.map(h => h.fieldState ?? 'balanced'),
            }}
            anomalies={state.anomalies ?? []}
          />
        )}
      </div>
      <div className="dashboard">
        <div className="panel panel-large">
          <h2>Coupling Map</h2>
          {state && <CouplingMap state={state} />}
        </div>

        <div className="panel">
          <h2>Negentropy Gauge</h2>
          {state && <NegentropyGauge metrics={state.meshMetrics} />}
        </div>

        <div className="panel">
          <h2>Entropy Field Evolution</h2>
          {state && <EntropyField history={state.history} />}
        </div>

        <div className="panel">
          <h2>Policy Console</h2>
          {state && <PolicyConsole state={state} />}
        </div>
      </div>
    </div>
  );
};
