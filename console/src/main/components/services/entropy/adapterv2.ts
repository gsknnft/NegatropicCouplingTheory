import {wt, Entropy} from '@sigilnet/qwave';
import { applyHannWindow } from '../windows';

export type Regime = 'chaos' | 'transitional' | 'coherent';

// const clamp01 = (v: number) => {
//   if (!Number.isFinite(v)) return 0;
//   if (v < 0) return 0;
//   if (v > 1) return 1;
//   return v;
// };

interface ResonatorState {
  history: number[];
  maxHistory: number;
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

export async function coherenceFromWavelet(
  samples: Float64Array,
  wavelet: string = 'haar',
  level?: number,
): Promise<{
  coherence: number;
  regime: Regime;
  entropyVelocity: number;
}> {
  const coherence = await measureWaveletEntropy(samples, wavelet, level);
  const entropy = 1 - coherence;

  resonator.history.push(entropy);
  if (resonator.history.length > resonator.maxHistory) resonator.history.shift();
  const prev = resonator.history.length > 1 ? resonator.history[resonator.history.length - 2] : entropy;
  const entropyVelocity = entropy - prev;

  const regime = regimeFromCoherence(coherence, entropy);
  return { coherence, regime, entropyVelocity };
}

export function measureEntropy(samples: Float64Array): number {
    const windowed = applyHannWindow(samples);
    return Entropy.measureSpectrumWithWindow(windowed);
}

export async function measureWaveletEntropy(samples: Float64Array, wavelet='haar', level?: number): Promise<number> {
  const windowed = applyHannWindow(samples);
  const resolvedLevel = level ?? Math.max(1, Math.floor(Math.log2(samples.length)) - 2);
  const coeffs = wt.wavedec(Array.from(windowed), 'haar', 'symmetric', resolvedLevel);

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
  return Math.max(1e-6, Math.min(C, 0.999999));
}


export function coherenceFromResonator(samples: Float64Array): {
  coherence: number;
  regime: Regime;
  entropyVelocity: number;
} {
  const spectrumEntropy = measureSpectrumWithWindow(samples);
  const coherence = 1 - spectrumEntropy;

  resonator.history.push(spectrumEntropy);
  if (resonator.history.length > resonator.maxHistory) resonator.history.shift();
  const prev = resonator.history.length > 1 ? resonator.history[resonator.history.length - 2] : spectrumEntropy;
  const entropyVelocity = spectrumEntropy - prev;

  const regime = regimeFromCoherence(coherence, spectrumEntropy);
  return { coherence, regime, entropyVelocity };
}

export function resetResonator(): void {
  resonator.history = [];
}
