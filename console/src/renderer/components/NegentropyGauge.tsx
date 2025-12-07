import React from 'react';
import { SimulationMetrics } from '../types';
import { fromFixedPoint } from '../../shared/fixedPoint';


interface NegentropyGaugeProps {
  metrics: SimulationMetrics;
}

export const NegentropyGauge: React.FC<NegentropyGaugeProps> = ({ metrics }) => {
  const negentropy = fromFixedPoint(metrics.negentropy);
  const coherence = fromFixedPoint(metrics.coherence);
  const velocity = fromFixedPoint(metrics.velocity);

  const getColorForValue = (value: number): string => {
    if (value > 0.8) return '#00ff88'; // High - green
    if (value > 0.5) return '#ffaa00'; // Medium - orange
    return '#ff4444'; // Low - red
  };

  const formatValue = (value: number): string => {
    return value.toFixed(3);
  };

  return (
    <div className="negentropy-gauge">
      <div className="gauge-item">
        <div className="gauge-label">Negentropy (N)</div>
        <div className="gauge-bar-container">
          <div 
            className="gauge-bar" 
            style={{ 
              width: `${negentropy * 100}%`,
              backgroundColor: getColorForValue(negentropy)
            }}
          />
        </div>
        <div className="gauge-value">{formatValue(negentropy)}</div>
        <div className="gauge-description">
          {negentropy > 0.8 ? 'High Order (Macro)' : 
           negentropy < 0.3 ? 'Low Order (Defensive)' : 
           'Balanced State'}
        </div>
      </div>

      <div className="gauge-item">
        <div className="gauge-label">Coherence (C)</div>
        <div className="gauge-bar-container">
          <div 
            className="gauge-bar" 
            style={{ 
              width: `${coherence * 100}%`,
              backgroundColor: getColorForValue(coherence)
            }}
          />
        </div>
        <div className="gauge-value">{formatValue(coherence)}</div>
        <div className="gauge-description">Bidirectional Alignment</div>
      </div>

      <div className="gauge-item">
        <div className="gauge-label">Entropy Velocity (v)</div>
        <div className="gauge-bar-container velocity">
          <div className="gauge-center-line" />
          <div 
            className="gauge-bar velocity-bar" 
            style={{ 
              width: `${Math.abs(velocity) * 100}%`,
              left: velocity < 0 ? `${50 - Math.abs(velocity) * 50}%` : '50%',
              backgroundColor: velocity > 0 ? '#ff6b6b' : '#4dabf7'
            }}
          />
        </div>
        <div className="gauge-value">{velocity > 0 ? '+' : ''}{formatValue(velocity)}</div>
        <div className="gauge-description">
          {velocity > 0 ? 'Increasing Entropy' : 
           velocity < 0 ? 'Decreasing Entropy' : 
           'Stable'}
        </div>
      </div>
    </div>
  );
};
