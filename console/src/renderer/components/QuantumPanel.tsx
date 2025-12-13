/**
 * QuantumPanels - Real-time Quantum Field Metrics Display
 * 
 * Shows live quantum signal metrics, field states, and resonance patterns
 */

import React, { useEffect, useState, useRef } from 'react';
import type { SignalFrame } from 'shared';

interface QuantumPanelProps {
  signal?: SignalFrame | null;
  showAnimations?: boolean;
}

export const QuantumPanel: React.FC<QuantumPanelProps> = ({ 
  signal,
  showAnimations = true 
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Default signal values for initial display
  const defaultSignal: SignalFrame = {
    coherence: 0.65,
    entropy: 0.42,
    phase: Math.PI / 4,
    dominantHz: 12.5,
    harmonics: [0.8, 0.5, 0.3, 0.2],
    magnitude: Array.from({ length: 32 }, () => Math.random() * 0.5 + 0.3)
  };

  const currentSignal = signal || defaultSignal;

  // Animation loop
  useEffect(() => {
    if (!showAnimations) return;

    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 0.05) % (Math.PI * 2));
    }, 50);

    return () => clearInterval(interval);
  }, [showAnimations]);

  // Draw field visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawFieldVisualization(ctx, canvas.width, canvas.height, currentSignal, animationPhase);
  }, [currentSignal, animationPhase]);

  const drawFieldVisualization = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    signal: SignalFrame,
    phase: number
  ) => {
    // Clear with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#000000');
    bgGradient.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    // Draw quantum field rings
    const numRings = 5;
    for (let i = 0; i < numRings; i++) {
      const radius = 30 + i * 20 + Math.sin(phase + i) * 5;
      const opacity = (1 - i / numRings) * signal.coherence;
      
      ctx.strokeStyle = `rgba(0, 255, 65, ${opacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw phase indicator
    const phaseX = centerX + Math.cos(signal.phase + phase) * 80;
    const phaseY = centerY + Math.sin(signal.phase + phase) * 80;
    
    ctx.fillStyle = '#00ff41';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ff41';
    ctx.beginPath();
    ctx.arc(phaseX, phaseY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw phase line
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(phaseX, phaseY);
    ctx.stroke();

    // Draw entropy particles
    const numParticles = Math.floor(signal.entropy * 20);
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2 + phase;
      const dist = 50 + Math.random() * 60;
      const x = centerX + Math.cos(angle) * dist;
      const y = centerY + Math.sin(angle) * dist;
      
      ctx.fillStyle = `rgba(255, 0, 255, ${0.3 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const getFieldState = (): { state: string; color: string; description: string } => {
    const { coherence, entropy } = currentSignal;
    
    if (coherence > 0.7 && entropy < 0.4) {
      return {
        state: 'COHERENT',
        color: 'text-green-400',
        description: 'Optimal execution window'
      };
    } else if (coherence < 0.4 || entropy > 0.7) {
      return {
        state: 'CHAOS',
        color: 'text-red-400',
        description: 'High volatility detected'
      };
    } else {
      return {
        state: 'TRANSITIONAL',
        color: 'text-yellow-400',
        description: 'Field in flux'
      };
    }
  };

  const fieldState = getFieldState();

  return (
    <div className="quantum-panels space-y-4">
      {/* Main Field State Panel */}
      <div className="bg-black border border-green-500 rounded-lg p-4 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-green-400 text-lg font-bold">⚛️ QUANTUM FIELD STATE</h2>
          <div className={`${fieldState.color} font-bold text-sm animate-pulse`}>
            {fieldState.state}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Field Visualization */}
          <div className="col-span-2 lg:col-span-1">
            <canvas
              ref={canvasRef}
              width={200}
              height={200}
              className="w-full border border-green-900 rounded bg-black"
            />
            <div className="text-center text-xs text-gray-500 mt-2">
              {fieldState.description}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="col-span-2 lg:col-span-1 space-y-3">
            {/* Coherence */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Coherence</span>
                <span className="text-green-400 font-bold">
                  {(currentSignal.coherence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-400 h-full transition-all duration-300"
                  style={{ width: `${currentSignal.coherence * 100}%` }}
                />
              </div>
            </div>

            {/* Entropy */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Entropy</span>
                <span className="text-purple-400 font-bold">
                  {(currentSignal.entropy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                  style={{ width: `${currentSignal.entropy * 100}%` }}
                />
              </div>
            </div>

            {/* Phase */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Phase</span>
                <span className="text-cyan-400 font-bold">
                  {currentSignal.phase.toFixed(3)} rad
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                  style={{ 
                    width: `${((currentSignal.phase % (Math.PI * 2)) / (Math.PI * 2)) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Dominant Frequency */}
            <div className="bg-gray-900 p-2 rounded">
              <div className="text-xs text-gray-400">Dominant Frequency</div>
              <div className="text-lg text-green-400 font-bold">
                {currentSignal.dominantHz.toFixed(2)} Hz
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Harmonics Panel */}
      <div className="bg-gray-900 border border-purple-500 rounded-lg p-4">
        <h3 className="text-purple-400 text-sm font-bold mb-3">🎵 HARMONIC ANALYSIS</h3>
        <div className="grid grid-cols-4 gap-2">
          {currentSignal.harmonics.map((strength, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-gray-400 mb-1">{i + 1}x</div>
              <div className="relative h-20 bg-gray-800 rounded overflow-hidden">
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ height: `${strength * 100}%` }}
                />
              </div>
              <div className="text-xs text-purple-400 mt-1 font-bold">
                {(strength * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-950 to-green-900 border border-green-700 rounded-lg p-3 text-center">
          <div className="text-xs text-green-300 mb-1">FIELD STRENGTH</div>
          <div className="text-2xl text-green-400 font-bold">
            {((currentSignal.coherence * (1 - currentSignal.entropy)) * 100).toFixed(0)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-950 to-purple-900 border border-purple-700 rounded-lg p-3 text-center">
          <div className="text-xs text-purple-300 mb-1">RESONANCE</div>
          <div className="text-2xl text-purple-400 font-bold">
            {(currentSignal.harmonics[0] * 100).toFixed(0)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-950 to-cyan-900 border border-cyan-700 rounded-lg p-3 text-center">
          <div className="text-xs text-cyan-300 mb-1">STABILITY</div>
          <div className="text-2xl text-cyan-400 font-bold">
            {((1 - currentSignal.entropy) * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
};
