/**
 * QuantumPanels - Real-time Quantum Field Metrics Visualization
 * 
 * Displays live quantum field state, coherence metrics, and phase analysis
 * Enhanced with better spectrum bars, tooltips, and time series tracking
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { SignalFrame } from 'shared';

interface QuantumPanelsProps {
  signal?: SignalFrame | null;
  showAnimations?: boolean;
}

// Historical data tracking for time series
interface HistoricalData {
  timestamp: number;
  coherence: number;
  entropy: number;
  fieldStrength: number;
  fieldState: 'coherent' | 'chaos' | 'transitional';
}

// Quantum field simulation constants
const FIELD_CONSTANTS = {
  // Base oscillation amplitude for coherence
  COHERENCE_BASE: 0.5,
  COHERENCE_AMPLITUDE: 0.3,
  COHERENCE_FREQUENCY: 0.5, // Hz
  
  // Entropy oscillation parameters
  ENTROPY_BASE: 0.5,
  ENTROPY_AMPLITUDE: 0.3,
  ENTROPY_FREQUENCY: 0.3, // Hz
  
  // Random fluctuation range
  NOISE_AMPLITUDE: 0.1,
  
  // Phase rotation speed (radians per update)
  PHASE_INCREMENT: 0.05,
  
  // Field strength oscillation
  FIELD_BASE: 0.5,
  FIELD_AMPLITUDE: 0.3,
  FIELD_FREQUENCY: 0.4, // Hz
  
  // State thresholds
  COHERENT_THRESHOLD: 0.7,
  COHERENT_ENTROPY_MAX: 0.4,
  CHAOS_COHERENCE_MIN: 0.4,
  CHAOS_ENTROPY_MIN: 0.7,
  
  // Update interval (ms)
  UPDATE_INTERVAL: 100,
};

export const QuantumPanels: React.FC<QuantumPanelsProps> = ({ signal, showAnimations = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [quantumState, setQuantumState] = useState({
    coherence: 0.65,
    entropy: 0.35,
    phase: 0,
    fieldStrength: 0.75,
  });
  const [, setAnimationPhase] = useState(0);
  const [fieldState, setFieldState] = useState<'coherent' | 'chaos' | 'transitional'>('coherent');
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const defaultSignal: SignalFrame = {
    coherence: 0.65,
    entropy: 0.42,
    phase: Math.PI / 4,
    dominantHz: 12.5,
    harmonics: [0.8, 0.5, 0.3, 0.2],
    magnitude: Array.from({ length: 32 }, () => Math.random() * 0.5 + 0.3)
  };
  const currentSignal = signal || defaultSignal;

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  // Simulate real-time quantum field updates and track historical data
  useEffect(() => {
    if (!showAnimations) return;

    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 0.05) % (Math.PI * 2));
      setQuantumState(prev => {
        // Simulate quantum field fluctuations using sinusoidal base + noise
        const time = Date.now() / 1000;
        const coherence = FIELD_CONSTANTS.COHERENCE_BASE + 
                         Math.sin(time * FIELD_CONSTANTS.COHERENCE_FREQUENCY) * FIELD_CONSTANTS.COHERENCE_AMPLITUDE + 
                         (Math.random() - 0.5) * FIELD_CONSTANTS.NOISE_AMPLITUDE;
        const entropy = FIELD_CONSTANTS.ENTROPY_BASE - 
                       Math.sin(time * FIELD_CONSTANTS.ENTROPY_FREQUENCY) * FIELD_CONSTANTS.ENTROPY_AMPLITUDE + 
                       (Math.random() - 0.5) * FIELD_CONSTANTS.NOISE_AMPLITUDE;
        const phase = (prev.phase + FIELD_CONSTANTS.PHASE_INCREMENT) % (Math.PI * 2);
        const fieldStrength = FIELD_CONSTANTS.FIELD_BASE + 
                             Math.cos(time * FIELD_CONSTANTS.FIELD_FREQUENCY) * FIELD_CONSTANTS.FIELD_AMPLITUDE + 
                             (Math.random() - 0.5) * FIELD_CONSTANTS.NOISE_AMPLITUDE;

        const clampedCoherence = Math.max(0, Math.min(1, coherence));
        const clampedEntropy = Math.max(0, Math.min(1, entropy));
        const clampedFieldStrength = Math.max(0, Math.min(1, fieldStrength));

        // Determine field state based on coherence and entropy thresholds
        let newFieldState: 'coherent' | 'chaos' | 'transitional';
        if (clampedCoherence > FIELD_CONSTANTS.COHERENT_THRESHOLD && clampedEntropy < FIELD_CONSTANTS.COHERENT_ENTROPY_MAX) {
          newFieldState = 'coherent';
        } else if (clampedCoherence < FIELD_CONSTANTS.CHAOS_COHERENCE_MIN || clampedEntropy > FIELD_CONSTANTS.CHAOS_ENTROPY_MIN) {
          newFieldState = 'chaos';
        } else {
          newFieldState = 'transitional';
        }
        setFieldState(newFieldState);

        // Add to historical data (keep last 100 points)
        setHistoricalData(prevHistory => {
          const newPoint: HistoricalData = {
            timestamp: Date.now(),
            coherence: clampedCoherence,
            entropy: clampedEntropy,
            fieldStrength: clampedFieldStrength,
            fieldState: newFieldState,
          };
          const updated = [...prevHistory, newPoint];
          return updated.slice(-100); // Keep last 100 points
        });

        return {
          coherence: clampedCoherence,
          entropy: clampedEntropy,
          phase,
          fieldStrength: clampedFieldStrength,
        };
      });
    }, FIELD_CONSTANTS.UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [showAnimations]);
  // Draw improved spectrum bars visualization
  useEffect(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawSpectrumBars(ctx, canvas.width, canvas.height, currentSignal);
  }, [currentSignal]);
  
  // Draw quantum field visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const draw = () => {
      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 60;

      // Draw field rings based on quantum state
      for (let i = 0; i < 5; i++) {
        const radius = baseRadius + i * 20;
        const opacity = (5 - i) / 5 * quantumState.fieldStrength;
        const phaseOffset = quantumState.phase + i * 0.3;

        // Coherence ring
        ctx.strokeStyle = `rgba(0, 255, 100, ${opacity * quantumState.coherence})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Entropy interference pattern
        if (quantumState.entropy > 0.3) {
          ctx.strokeStyle = `rgba(255, 100, 100, ${opacity * quantumState.entropy * 0.5})`;
          ctx.lineWidth = 1;
          for (let j = 0; j < 8; j++) {
            const angle = (j / 8) * Math.PI * 2 + phaseOffset;
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + 10);
            const y2 = centerY + Math.sin(angle) * (radius + 10);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      // Draw phase indicator
      const phaseX = centerX + Math.cos(quantumState.phase) * baseRadius;
      const phaseY = centerY + Math.sin(quantumState.phase) * baseRadius;
      
      ctx.fillStyle = '#00ffff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00ffff';
      ctx.beginPath();
      ctx.arc(phaseX, phaseY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw center glow based on field state
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40);
      if (fieldState === 'coherent') {
        gradient.addColorStop(0, 'rgba(0, 255, 100, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 255, 100, 0)');
      } else if (fieldState === 'chaos') {
        gradient.addColorStop(0, 'rgba(255, 50, 50, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
      ctx.fill();

      // Continue animation loop
      animationFrameId = requestAnimationFrame(draw);
    };

    // Start animation
    animationFrameId = requestAnimationFrame(draw);

    // Cleanup on unmount
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [quantumState, fieldState]);

  // Enhanced spectrum bars visualization
  const drawSpectrumBars = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    signal: SignalFrame
  ) => {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Use magnitude data if available, otherwise create from harmonics
    const baseMagnitude = signal.magnitude || [];
    let magnitude: number[];
    
    if (baseMagnitude.length === 0 || baseMagnitude.every((v: number) => v === 0)) {
      // Create magnitude from harmonics for better visualization
      magnitude = new Array(32).fill(0);
      signal.harmonics.forEach((h: number, i: number) => {
        const pos = Math.floor(((i + 1) * magnitude.length) / (signal.harmonics.length + 1));
        for (let j = -2; j <= 2; j++) {
          const idx = Math.max(0, Math.min(magnitude.length - 1, pos + j));
          magnitude[idx] = Math.max(magnitude[idx], h * Math.exp(-(j * j) / 2));
        }
      });
    } else {
      magnitude = baseMagnitude;
    }

    const barCount = Math.min(magnitude.length, 64);
    const barWidth = width / barCount;
    const maxMag = Math.max(...magnitude, 0.1);

    // Draw spectrum bars with gradient
    for (let i = 0; i < barCount; i++) {
      const value = magnitude[Math.floor((i * magnitude.length) / barCount)] || 0;
      const normalized = value / maxMag;
      const barHeight = Math.max(2, normalized * height * 0.9);

      // Create gradient from bottom to top
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      
      // Color based on coherence and entropy
      if (signal.coherence > 0.7) {
        gradient.addColorStop(0, '#00ff41');
        gradient.addColorStop(0.5, '#00dd33');
        gradient.addColorStop(1, '#00ff88');
      } else if (signal.entropy > 0.7) {
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(0.5, '#dd3333');
        gradient.addColorStop(1, '#ff8888');
      } else {
        gradient.addColorStop(0, '#ffaa00');
        gradient.addColorStop(0.5, '#dd8800');
        gradient.addColorStop(1, '#ffcc44');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);

      // Add glow effect for high values
      if (normalized > 0.7) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = signal.coherence > 0.7 ? '#00ff41' : '#ffaa00';
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
        ctx.shadowBlur = 0;
      }
    }

    // Draw coherence threshold line
    const coherenceLine = height * (1 - signal.coherence);
    ctx.strokeStyle = signal.coherence > 0.7 ? 'rgba(0, 255, 65, 0.5)' : 'rgba(255, 170, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, coherenceLine);
    ctx.lineTo(width, coherenceLine);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = signal.coherence > 0.7 ? '#00ff41' : '#ffaa00';
    ctx.font = '10px monospace';
    ctx.fillText(`Coherence: ${(signal.coherence * 100).toFixed(0)}%`, 10, coherenceLine - 5);
  };

  // Export canvas as image
  const exportAsImage = (type: 'png' | 'jpeg' = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `quantum-field-${Date.now()}.${type}`;
    link.href = canvas.toDataURL(`image/${type}`);
    link.click();
  };

  // Export data as JSON
  const exportAsJSON = () => {
    const data = {
      currentState: quantumState,
      fieldState,
      historicalData,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `quantum-data-${Date.now()}.json`;
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.click();
    // Clean up to prevent memory leak
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // Helper to get field state label and color
  const getFieldStateLabel = (): string => {
    if (fieldState === 'coherent') return '✓ COHERENT';
    if (fieldState === 'chaos') return '⚠ CHAOS';
    return '⟳ TRANSITIONAL';
  };

  const getFieldStateColor = (): string => {
    if (fieldState === 'coherent') return 'text-green-400';
    if (fieldState === 'chaos') return 'text-red-400';
    return 'text-yellow-400';
  };

  
  const getCoherenceColor = (coherence: number): string => {
    if (coherence > 0.7) return 'text-green-400';
    if (coherence > 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEntropyColor = (entropy: number): string => {
    if (entropy < 0.3) return 'text-green-400';
    if (entropy < 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Calculate harmonics for display
  const harmonics = [
    quantumState.coherence * 0.9,
    quantumState.coherence * 0.7,
    quantumState.coherence * 0.5,
    quantumState.coherence * 0.3,
  ];

  // Memoize average calculations to avoid redundant computation
  const averageCoherence = useMemo(() => {
    if (historicalData.length === 0) return 0;
    return historicalData.reduce((sum, d) => sum + d.coherence, 0) / historicalData.length;
  }, [historicalData]);

  const averageEntropy = useMemo(() => {
    if (historicalData.length === 0) return 0;
    return historicalData.reduce((sum, d) => sum + d.entropy, 0) / historicalData.length;
  }, [historicalData]);

  return (
    
    <div ref={containerRef} className="quantum-panels bg-gray-900 border border-purple-500 rounded-lg p-3 md:p-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-purple-400 text-lg md:text-xl font-bold">⚛️ QUANTUM FIELD METRICS</h2>
        <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className={`text-xs md:text-sm font-bold ${getFieldStateColor()}`}>
            {getFieldStateLabel()}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-2 md:px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded transition-colors whitespace-nowrap"
              title="Export visualizations"
            >
              📸 {isMobile ? '' : 'Export'}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 bg-gray-800 border border-purple-500 rounded-lg shadow-lg p-2 z-10 min-w-[150px]">
                <button
                  onClick={() => { exportAsImage('png'); setShowExportMenu(false); }}
                  className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-purple-700 rounded"
                >
                  PNG Image
                </button>
                <button
                  onClick={() => { exportAsImage('jpeg'); setShowExportMenu(false); }}
                  className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-purple-700 rounded"
                >
                  JPEG Image
                </button>
                <button
                  onClick={() => { exportAsJSON(); setShowExportMenu(false); }}
                  className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-purple-700 rounded"
                >
                  JSON Data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quantum Field Visualization */}
      <div className="mb-3 md:mb-4 bg-black rounded-lg border border-purple-900 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={isMobile ? 200 : 300}
          className="w-full"
        />
      </div>

      {/* Enhanced Spectrum Bars */}
      <div className="mb-3 md:mb-4 bg-black rounded-lg border border-green-900 overflow-hidden">
        <div className="px-2 md:px-3 py-1 md:py-2 bg-gray-900 border-b border-green-900">
          <span className="text-green-400 text-xs font-bold">🎵 SPECTRUM ANALYSIS</span>
        </div>
        <canvas
          ref={spectrumCanvasRef}
          width={400}
          height={isMobile ? 80 : 120}
          className="w-full"
        />
      </div>

      {/* Time Series Chart */}
      {historicalData.length > 10 && (
        <div className="mb-3 md:mb-4 bg-black rounded-lg border border-cyan-900 p-2 md:p-3">
          <div className="text-cyan-400 text-xs font-bold mb-2">📈 TIME SERIES</div>
          <div className="relative" style={{ height: isMobile ? '60px' : '80px' }}>
            <svg width="100%" height="100%" viewBox={`0 0 400 ${isMobile ? 60 : 80}`} preserveAspectRatio="none">
              {/* Coherence line */}
              <polyline
                points={historicalData.map((d, i) => 
                  `${(i / historicalData.length) * 400},${(isMobile ? 60 : 80) - d.coherence * (isMobile ? 50 : 70)}`
                ).join(' ')}
                fill="none"
                stroke="#00ff41"
                strokeWidth="2"
                opacity="0.8"
              />
              {/* Entropy line */}
              <polyline
                points={historicalData.map((d, i) => 
                  `${(i / historicalData.length) * 400},${(isMobile ? 60 : 80) - (1 - d.entropy) * (isMobile ? 50 : 70)}`
                ).join(' ')}
                fill="none"
                stroke="#ff4444"
                strokeWidth="2"
                opacity="0.8"
              />
            </svg>
          </div>
          <div className="flex justify-between mt-1 md:mt-2 text-xs">
            <span className="text-green-400">● Coherence</span>
            <span className="text-red-400">● Entropy</span>
          </div>
        </div>
      )}

      {/* Metrics Grid with Enhanced Tooltips */}
      <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
        <div 
          className="bg-black border border-green-900 rounded p-2 md:p-3 animate-slide-in relative cursor-help"
          onMouseEnter={() => !isMobile && setHoveredMetric('coherence')}
          onMouseLeave={() => setHoveredMetric(null)}
          onClick={() => isMobile && setHoveredMetric(hoveredMetric === 'coherence' ? null : 'coherence')}
        >
          <div className="text-gray-500 text-xs mb-1">COHERENCE</div>
          <div className={`text-xl md:text-2xl font-bold font-mono ${getCoherenceColor(quantumState.coherence)}`}>
            {(quantumState.coherence * 100).toFixed(1)}%
          </div>
          <div className="mt-1 md:mt-2 bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-green-400 transition-all duration-300 glow-pulse"
              style={{ width: `${quantumState.coherence * 100}%` }}
            />
          </div>
          {hoveredMetric === 'coherence' && !isMobile && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 border border-green-500 rounded-lg p-3 text-xs z-20 shadow-xl">
              <div className="font-bold text-green-400 mb-1">Quantum Coherence</div>
              <div className="text-gray-300">
                Measures signal phase stability and synchronization. Higher values indicate optimal execution conditions.
              </div>
              <div className="mt-2 text-gray-400">
                Range: {historicalData.length > 0 
                  ? `${(Math.min(...historicalData.map(d => d.coherence)) * 100).toFixed(0)}% - ${(Math.max(...historicalData.map(d => d.coherence)) * 100).toFixed(0)}%`
                  : 'Collecting...'}
              </div>
            </div>
          )}
          {hoveredMetric === 'coherence' && isMobile && (
            <div className="mt-2 p-2 bg-gray-800 border border-green-500 rounded text-xs">
              <div className="font-bold text-green-400 mb-1">Quantum Coherence</div>
              <div className="text-gray-300 text-xs">
                Measures signal phase stability. Higher = better execution.
              </div>
            </div>
          )}
        </div>

        <div 
          className="bg-black border border-red-900 rounded p-2 md:p-3 animate-slide-in relative cursor-help" 
          style={{ animationDelay: '0.1s' }}
          onMouseEnter={() => !isMobile && setHoveredMetric('entropy')}
          onMouseLeave={() => setHoveredMetric(null)}
          onClick={() => isMobile && setHoveredMetric(hoveredMetric === 'entropy' ? null : 'entropy')}
        >
          <div className="text-gray-500 text-xs mb-1">ENTROPY</div>
          <div className={`text-xl md:text-2xl font-bold font-mono ${getEntropyColor(quantumState.entropy)}`}>
            {(quantumState.entropy * 100).toFixed(1)}%
          </div>
          <div className="mt-1 md:mt-2 bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-red-400 transition-all duration-300"
              style={{ width: `${quantumState.entropy * 100}%` }}
            />
          </div>
          {hoveredMetric === 'entropy' && !isMobile && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 border border-red-500 rounded-lg p-3 text-xs z-20 shadow-xl">
              <div className="font-bold text-red-400 mb-1">Field Entropy</div>
              <div className="text-gray-300">
                Quantifies disorder and unpredictability. Lower values suggest stable market conditions and reduced execution risk.
              </div>
              <div className="mt-2 text-gray-400">
                Range: {historicalData.length > 0 
                  ? `${(Math.min(...historicalData.map(d => d.entropy)) * 100).toFixed(0)}% - ${(Math.max(...historicalData.map(d => d.entropy)) * 100).toFixed(0)}%`
                  : 'Collecting...'}
              </div>
            </div>
          )}
          {hoveredMetric === 'entropy' && isMobile && (
            <div className="mt-2 p-2 bg-gray-800 border border-red-500 rounded text-xs">
              <div className="font-bold text-red-400 mb-1">Field Entropy</div>
              <div className="text-gray-300 text-xs">
                Measures disorder. Lower = more stable conditions.
              </div>
            </div>
          )}
        </div>

        <div 
          className="bg-black border border-cyan-900 rounded p-2 md:p-3 animate-slide-in relative cursor-help" 
          style={{ animationDelay: '0.2s' }}
          onMouseEnter={() => !isMobile && setHoveredMetric('phase')}
          onMouseLeave={() => setHoveredMetric(null)}
          onClick={() => isMobile && setHoveredMetric(hoveredMetric === 'phase' ? null : 'phase')}
        >
          <div className="text-gray-500 text-xs mb-1">PHASE</div>
          <div className="text-xl md:text-2xl font-bold font-mono text-cyan-400">
            {quantumState.phase.toFixed(3)}
          </div>
          <div className="text-gray-500 text-xs mt-1">radians</div>
          {hoveredMetric === 'phase' && !isMobile && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 border border-cyan-500 rounded-lg p-3 text-xs z-20 shadow-xl">
              <div className="font-bold text-cyan-400 mb-1">Phase Angle</div>
              <div className="text-gray-300">
                Current rotation angle of the quantum field oscillation. Phase lock at specific angles indicates resonance patterns.
              </div>
              <div className="mt-2 text-gray-400">
                Degrees: {(quantumState.phase * 180 / Math.PI).toFixed(1)}°
              </div>
            </div>
          )}
          {hoveredMetric === 'phase' && isMobile && (
            <div className="mt-2 p-2 bg-gray-800 border border-cyan-500 rounded text-xs">
              <div className="font-bold text-cyan-400 mb-1">Phase Angle</div>
              <div className="text-gray-300 text-xs">
                Current field rotation. {(quantumState.phase * 180 / Math.PI).toFixed(1)}°
              </div>
            </div>
          )}
        </div>

        <div 
          className="bg-black border border-purple-900 rounded p-2 md:p-3 animate-slide-in relative cursor-help" 
          style={{ animationDelay: '0.3s' }}
          onMouseEnter={() => !isMobile && setHoveredMetric('fieldStrength')}
          onMouseLeave={() => setHoveredMetric(null)}
          onClick={() => isMobile && setHoveredMetric(hoveredMetric === 'fieldStrength' ? null : 'fieldStrength')}
        >
          <div className="text-gray-500 text-xs mb-1">FIELD STRENGTH</div>
          <div className="text-xl md:text-2xl font-bold font-mono text-purple-400">
            {(quantumState.fieldStrength * 100).toFixed(1)}%
          </div>
          <div className="mt-1 md:mt-2 bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-purple-400 transition-all duration-300"
              style={{ width: `${quantumState.fieldStrength * 100}%` }}
            />
          </div>
          {hoveredMetric === 'fieldStrength' && !isMobile && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 border border-purple-500 rounded-lg p-3 text-xs z-20 shadow-xl">
              <div className="font-bold text-purple-400 mb-1">Field Strength</div>
              <div className="text-gray-300">
                Overall intensity of the quantum field. Combined metric of coherence and stability indicating signal power.
              </div>
              <div className="mt-2 text-gray-400">
                Efficiency Factor: {(quantumState.fieldStrength * quantumState.coherence * 100).toFixed(0)}%
              </div>
            </div>
          )}
          {hoveredMetric === 'fieldStrength' && isMobile && (
            <div className="mt-2 p-2 bg-gray-800 border border-purple-500 rounded text-xs">
              <div className="font-bold text-purple-400 mb-1">Field Strength</div>
              <div className="text-gray-300 text-xs">
                Overall field intensity and signal power.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Harmonic Analysis */}
      <div className="bg-black border border-purple-900 rounded p-2 md:p-3 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="text-gray-500 text-xs mb-2">HARMONIC ANALYSIS</div>
        <div className="flex gap-1 md:gap-2">
          {harmonics.map((h, i) => (
            <div key={i} className="flex-1 bg-purple-950 rounded overflow-hidden" style={{ height: isMobile ? '40px' : '50px' }}>
              <div
                className="bg-gradient-to-t from-purple-600 to-purple-400 w-full transition-all duration-500 glow-pulse"
                style={{
                  height: `${Math.min(100, h * 100)}%`,
                  opacity: 0.7 + h * 0.3,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-600">
          <span>H1</span>
          <span>H2</span>
          <span>H3</span>
          <span>H4</span>
        </div>
      </div>

      {/* Status Indicator with Statistics */}
      <div className="mt-4 text-center">
        <div className="text-xs text-gray-500">
          Real-time field monitoring • Updates every 100ms
        </div>
        {historicalData.length > 0 && (
          <div className="mt-2 flex justify-center gap-4 text-xs">
            <span className="text-gray-400">
              Avg Coherence: <span className={getCoherenceColor(averageCoherence)}>
                {(averageCoherence * 100).toFixed(1)}%
              </span>
            </span>
            <span className="text-gray-400">
              Avg Entropy: <span className={getEntropyColor(averageEntropy)}>
                {(averageEntropy * 100).toFixed(1)}%
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
