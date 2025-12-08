import { Entropy } from './index';

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

export function coherenceFromResonator(samples: Float64Array): {
  coherence: number;
  regime: Regime;
  entropyVelocity: number;
} {
  const spectrumEntropy = Entropy.measureSpectrumWithWindow(samples);
  // Coherence proxy: inverse of entropy with a soft cap
  const coherence = Math.max(0, Math.min(1, 1 - spectrumEntropy));

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
