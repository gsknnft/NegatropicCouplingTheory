import React, { useEffect, useRef } from 'react';
import { SimulationState } from '../types';
import { fromFixedPoint } from '../../shared/fixedPoint';

type WaveletModule = {
  wavedec?: (data: number[], wavelet?: string, level?: number) => any;
};

interface WaveletScalogramProps {
  state: SimulationState;
  waveletName?: string;
  levels?: number;
}

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

const flattenCoeffs = (coeffs: any): number[][] => {
  if (!Array.isArray(coeffs)) return [];
  // qwave returns array of arrays by scale; keep as 2D
  return coeffs
    .map((c) => {
      if (Array.isArray(c)) {
        return c.map((v) => (typeof v === 'number' ? v : 0));
      }
      return [];
    })
    .filter((row) => row.length > 0);
};

export const WaveletScalogram: React.FC<WaveletScalogramProps> = ({
  state,
  waveletName = 'haar',
  levels,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth || 600;
    const height = 220;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#0b0c0f';
    ctx.fillRect(0, 0, width, height);

    const series = state.history.slice(-128).map((h) => fromFixedPoint(h.negentropy));
    if (series.length < 4) return;

    let coeffs: number[][] = [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const qwave: WaveletModule = require('@sigilnet/QWave');
      const lvl = levels ?? Math.max(1, Math.floor(Math.log2(series.length)) - 2);
      const raw = qwave?.wavedec ? qwave.wavedec(series, waveletName, lvl) : null;
      if (raw) coeffs = flattenCoeffs(raw);
    } catch (err) {
      coeffs = [];
    }

    if (coeffs.length === 0) {
      ctx.fillStyle = '#333';
      ctx.fillText('Scalogram unavailable (no wavelet backend)', 10, 20);
      return;
    }

    // Build energy matrix
    const energies = coeffs.map((row) => row.map((v) => v * v));
    let maxEnergy = 0;
    energies.forEach((row) => row.forEach((v) => (maxEnergy = Math.max(maxEnergy, v))));
    maxEnergy = Math.max(maxEnergy, 1e-9);

    const rows = energies.length;
    const cols = Math.max(...energies.map((r) => r.length));
    const cellW = width / cols;
    const cellH = height / rows;

    const colorFor = (val: number) => {
      const t = clamp01(val / maxEnergy);
      const r = Math.floor(255 * t);
      const g = Math.floor(120 * (1 - t));
      const b = Math.floor(255 * (1 - t * 0.5));
      return `rgba(${r},${g},${b},0.8)`;
    };

    energies.forEach((row, i) => {
      const y = i * cellH;
      row.forEach((v, j) => {
        const x = j * cellW;
        ctx.fillStyle = colorFor(v);
        ctx.fillRect(x, y, cellW + 1, cellH + 1);
      });
    });

    // Regime overlay
    if (state.meshMetrics.regime) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(0, 0, 120, 40);
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(`Regime: ${state.meshMetrics.regime}`, 8, 20);
    }
  }, [state, waveletName, levels]);

  return (
    <div className="signal-scope-panel">
      <div className="signal-header">
        <div>
          <div className="label">Wavelet Scalogram</div>
          <div className="label">Wavelet: {waveletName}</div>
        </div>
      </div>
      <canvas ref={canvasRef} className="signal-canvas" />
      <div className="legend">
        <span className="dot neg" /> High energy
        <span className="dot coh" /> Mid energy
        <span className="dot vel" /> Low energy
      </div>
    </div>
  );
};
