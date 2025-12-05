import React, { useState, useEffect } from 'react';
import { SimulationState } from './types';
import { EntropyField } from './components/EntropyField';
import { NegentropyGauge } from './components/NegentropyGauge';
import { CouplingMap } from './components/CouplingMap';
import { PolicyConsole } from './components/PolicyConsole';
import './styles/theme.css';

export const App: React.FC = () => {
  const [state, setState] = useState<SimulationState | null>(null);
  const [autoDemo, setAutoDemo] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Initialize simulation on mount
  useEffect(() => {
    initializeSimulation();
  }, []);

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
  }, [autoDemo]);

  const initializeSimulation = async () => {
    try {
      const response = await window.ncf.runSimulation({ nodes: 5, edges: 10 });
      if (response.success && response.state) {
        setState(response.state as SimulationState);
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
          setState(stateResponse.state as SimulationState);
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
      
      const response = await window.ncf.reset({ nodes: 5, edges: 10 });
      if (response.success && response.state) {
        setState(response.state as SimulationState);
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
