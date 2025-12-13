import { applyHannWindow } from '../windows';
import type { Complex } from '../compute-fft';
import { Entropy } from './index';
import {wt} from '@sigilnet/qwave';

// Debug toggle for wavelet diagnostics
const DEBUG_WAVELET =
  typeof process !== 'undefined' &&
  !!process.env &&
  (process.env.DEBUG_WAVELET === '1' || process.env.DEBUG_WAVELET === 'true');

export type Regime = 'chaos' | 'transitional' | 'coherent';

interface ResonatorState {
  history: number[];
  maxHistory: number;
  lastEntropy?: number;
}

const resonator: ResonatorState = {
  history: [],
  maxHistory: 128,
};

const regimeFromCoherence = (coherence: number, entropy: number): Regime => {
  if (coherence > 0.7 && entropy < 0.4) return 'coherent';
  if (coherence < 0.4 || entropy > 0.7) return 'chaos';
  return 'transitional';
};

export function measureSpectrumWithWindow(samples: Float64Array): number {
  return Entropy.measureSpectrumWithWindow(samples);
}

export function coherenceFromWavelet(
  samples: Float64Array,
  wavelet: string = 'haar',
  level?: number,
): {
  coherence: number;
  regime: Regime;
  entropyVelocity: number;
} {
  // waveEntropy here is actually a coherence proxy (1 - normEntropy)
  let coherence = measureWaveletEntropy(samples, wavelet, level);
  // If wavelet failed or produced degenerate values, fall back to FFT coherence proxy
  if (!Number.isFinite(coherence) || coherence <= 0) {
    let spectrum = Entropy.measureSpectrumWithWindow(samples);
  }
  // Avoid getting pinned at exactly 0/1 and blend a touch of spectral for stability
  const spectralEntropy = Entropy.measureSpectrumWithWindow(samples);
  const spectralCoherence = 1 - spectralEntropy;
  const blendedCoh = 0.6 * coherence + 0.4 * spectralCoherence;
  const entropy = 1 - blendedCoh;

  resonator.history.push(entropy);
  if (resonator.history.length > resonator.maxHistory) resonator.history.shift();
  const prev = resonator.history.length > 1 ? resonator.history[resonator.history.length - 2] : entropy;
  const entropyVelocity = entropy - prev;

  const regime = regimeFromCoherence(coherence, entropy);
  return { coherence, regime, entropyVelocity };
}


const flattenCoeffs = (coeffs: Float64Array | Float64Array[]): number[] => {
  const out: number[] = [];
  if (Array.isArray(coeffs)) {
    coeffs.forEach((c) => {
      if (Array.isArray(c)) c.forEach((v) => out.push(typeof v === 'number' ? v : 0));
      else if (typeof c === 'number') out.push(c);
    });
  } else if (coeffs && typeof coeffs === 'object') {
    Object.values(coeffs).forEach((v) => {
      if (Array.isArray(v)) v.forEach((x) => out.push(typeof x === 'number' ? x : 0));
    });
  }
  return out;
};

export function measureWaveletCoherence(samples: Float64Array, wavelet: string = 'haar', level?: number): number {
  try {
      // Prefer the QWave Entropy class if present
      const windowed = (applyHannWindow(samples) as Float64Array) ?? samples;
      const entropy = Entropy.measureSpectrumWithWindow(Float64Array.from(windowed));
    // Window the samples to reduce edge effects before wavelet decomposition   
    // const data = Array.from(windowed);
    const resolvedLevel = level ?? Math.max(1, Math.floor(Math.log2(samples.length)) - 2);
    const coeffs = wt.wavedec(Array.from(windowed), 'haar', 'symmetric', resolvedLevel);
    const cleaned = wt.waverec(coeffs, 'haar');
    const flat = flattenCoeffs(Float64Array.from(coeffs));
    const flatClean = flattenCoeffs(Float64Array.from(cleaned));
    if (flatClean.length === 0) {
      const entropyFallback = Entropy.measureSpectrumWithWindow(samples);
      return entropyFallback;
    }
    // Band entropy: energy distribution across bands (lower entropy = higher coherence)
    const bandEnergies: number[] = [];
    if (Array.isArray(coeffs)) {
      coeffs.forEach((band: any) => {
        if (Array.isArray(band)) {
          const e = band.reduce((acc: number, v: number) => acc + v * v, 0);
          bandEnergies.push(e);
        }
      });
    } else if (coeffs && typeof coeffs === 'object') {
      Object.values(coeffs).forEach((band: any) => {
        if (Array.isArray(band)) {
          const e = band.reduce((acc: number, v: number) => acc + v * v, 0);
          bandEnergies.push(e);
        }
      });
    }

    // Always compute a spectral fallback for blending
    const spectralEntropy = Entropy.measureSpectrumWithWindow(windowed);
    const spectralCoherence = 1 - spectralEntropy;

    // Fallback to flattened energy if no per-band data
    if (bandEnergies.length === 0) {
      const energy = flat.map((v) => v * v);
      const total = energy.reduce((acc, v) => acc + v, 0);
      if (total <= 0) return Math.max(1e-4, spectralCoherence);
      const probs = energy.map((e) => e / total);
      const entropy = -probs.reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0);
      const normEntropy = entropy / Math.log2(Math.max(2, probs.length));
      const coherenceFromEnergy = 1 - normEntropy;
      const spec = 0.6 * coherenceFromEnergy + 0.4 * spectralCoherence;
      return 1 - Entropy.measureSpectrumWithWindow(samples);
    }

    const totalBand = bandEnergies.reduce((a, b) => a + b, 0);
    const bandProbs = bandEnergies.map((e) => e / totalBand);
    const bandEntropy = -bandProbs.reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0);
    const normBandEntropy = bandEntropy / Math.log2(Math.max(2, bandProbs.length));

    // Band concentration (helps when a single band dominates)
    const maxBand = Math.max(...bandEnergies);
    const bandConcentration = totalBand > 0 ? maxBand / totalBand : 0;

    if (DEBUG_WAVELET) {
      // eslint-disable-next-line no-console
      console.debug('[measureWaveletCoherence]', {
        wavelet,
        level: resolvedLevel,
        bandEnergies: bandEnergies.slice(0, 8),
        normBandEntropy,
        bandConcentration,
        spectralCoherence,
      });
    }

    // Blend band entropy, concentration, and spectral to avoid flatlines
    const blended =
      0.5 * normBandEntropy +
      0.25 * bandConcentration +
      0.25 * spectralCoherence;
    const coherence = 1 - blended;
    return Math.max(1e-6, Math.min(coherence, 0.999999));
  } catch (err) {
    // Fallback to pure spectral method on error
    return 1 - Entropy.measureSpectrumWithWindow(samples);
  }
}

export function measureWaveletEntropy(samples: Float64Array, wavelet='haar', level?: number): number {
  const windowed = applyHannWindow(samples);
  const resolvedLevel = level ?? Math.max(1, Math.floor(Math.log2(samples.length)) - 2);
  const coeffs = wt.wavedec(Array.from(windowed), 'haar', 'symmetric', resolvedLevel);
  // const coeffs = wt.wavedec(windowed, wavelet, resolvedLevel);

  // band energies
  const bandEnergies = Array.isArray(coeffs)
    ? coeffs.map((band: any) => Array.isArray(band)
        ? band.reduce((a:number,v:number)=>a+v*v,0) : 0)
    : [];

  const total = bandEnergies.reduce((a,b)=>a+b,0);
  if (total <= 0) return 1 - Entropy.measureSpectrumWithWindow(windowed);

  const probs = bandEnergies.map(e=>e/total);
  const H_w = -probs.reduce((s,p)=>s+(p>0?p*Math.log2(p):0),0) / Math.log2(Math.max(2,probs.length));
  const C_w = 1 - H_w;

  const C_b = Math.max(...bandEnergies)/total;
  const C_f = 1 - Entropy.measureSpectrumWithWindow(windowed);

  const C = 0.5*C_w + 0.25*C_b + 0.25*C_f;

  if (DEBUG_WAVELET) {
    // eslint-disable-next-line no-console
    console.debug('[measureWaveletEntropy]', {
      wavelet,
      level: resolvedLevel,
      bandEnergies: bandEnergies.slice(0,8),
      C_w,
      C_b,
      C_f,
      C,
    });
  }

  return Math.max(1e-6, Math.min(C, 0.99999));
}


export function coherenceFromResonator(samples: Float64Array): {
  coherence: number;
  regime: Regime;
  entropyVelocity: number;
} {
  const spectrumEntropy = Entropy.measureSpectrumWithWindow(samples);
  // Coherence proxy: inverse of entropy with a soft cap
  const coherence = 1 - spectrumEntropy;

  // Track entropy velocity over history
  resonator.history.push(spectrumEntropy);
  if (resonator.history.length > resonator.maxHistory) resonator.history.shift();
  const prev = resonator.history.length > 1 ? resonator.history[resonator.history.length - 2] : spectrumEntropy;
  const entropyVelocity = spectrumEntropy - prev;

  const regime = regimeFromCoherence(coherence, spectrumEntropy);

  return { coherence, regime, entropyVelocity };
}

export function resetResonator(): void {
  resonator.history = [];
  resonator.lastEntropy = undefined;
}
