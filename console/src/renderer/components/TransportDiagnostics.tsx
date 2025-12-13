import React from 'react';

interface ScenarioRow {
  id: string;
  serverMode: string;
  clientMode: string;
  durationMs: number;
  messagesReceived: number;
  bytesReceived: number;
  msgsPerSec: number;
  mbPerSec: number;
  framing?: string;
  skipped?: boolean;
  reason?: string;
}

interface TransportDiagnosticsProps {
  scenarios: ScenarioRow[];
  onRunBench: () => void;
  running: boolean;
}

export const TransportDiagnostics: React.FC<TransportDiagnosticsProps> = ({ scenarios, onRunBench, running }) => {
  return (
    <div className="transport-diagnostics">
      <div className="diag-row" style={{ marginBottom: 12 }}>
        <button onClick={onRunBench} disabled={running}>
          {running ? 'Running…' : 'Run QWormhole Bench'}
        </button>
      </div>
      <div className="transport-table">
        <div className="transport-header">
          <span>Scenario</span>
          <span>Duration</span>
          <span>Msgs/s</span>
          <span>MB/s</span>
          <span>Notes</span>
        </div>
        {scenarios.map((s, idx) => (
          <div className="transport-row" key={idx}>
            <span>{s.id}</span>
            <span>{s.durationMs ? `${s.durationMs.toFixed(2)} ms` : '—'}</span>
            <span>{s.msgsPerSec ? s.msgsPerSec.toFixed(0) : '—'}</span>
            <span>{s.mbPerSec ? s.mbPerSec.toFixed(2) : '—'}</span>
            <span>{s.skipped ? s.reason ?? 'skipped' : `${s.serverMode} → ${s.clientMode}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
