/**
 * Signal Engine - FFT and Coherence Processing
 * 
 * Uses real plugin data when available (QTransformPlugin)
 * Falls back to standalone DFT implementation for demo mode
 */

import type { SignalFrame } from '../../../shared';
import {
  generateSignal,
  calculateCoherence,
  calculateEntropy,
  findDominantFrequency,
  extractHarmonics,
} from '../../../shared';
import {FFT} from '@sigilnet/fft-ts';

/**
 * Generate signal frame using real QTransform plugin
 */

/**
 * Generate signal frame from efficiency data
 * Uses real plugin data (QTransformPlugin) when available
 * Falls back to standalone DFT for demo mode
 */
export async function generateSignalFrame(
  efficiency: Float64Array,
): Promise<SignalFrame> {
  // Generate input signal based on efficiency
  let signal: Float64Array = new Float64Array(efficiency.length);
  try {
    signal = generateSignal(efficiency);
    return generateWithFFT(signal);
  } catch (error) {
    console.warn('Failed to use FFT, falling back to DFT:', error);
    // Ensure signal is assigned before using fallback
    if (!signal || signal.length === 0) {
      signal = generateSignal(efficiency);
    }
    return generateWithFallbackFFT(signal);
  }
}

export function generateWithFFT(signal: Float64Array): SignalFrame {
  try {
    // Use real plugin FFT
    const fft = new FFT(signal);
    const out = fft.createComplexArray();
    const inputComplex = fft.toComplexArray(Float64Array.from(signal));
    fft.transform(out, inputComplex);
    fft.completeSpectrum(out);

    const magnitude: number[] = [];
    const phaseData: number[] = [];

    // Calculate magnitude and phase from complex FFT result
    for (let i = 0; i < out.length / 2; i += 2) {
      const real = out[i];
      const imag = out[i + 1];
      magnitude.push(Math.sqrt(real * real + imag * imag));
      phaseData.push(Math.atan2(imag, real));
    }
    
    const coherence = calculateCoherence(magnitude);
    const entropy = calculateEntropy(magnitude);
    const dominantHz = findDominantFrequency(magnitude);
    const harmonics = extractHarmonics(magnitude, dominantHz);
    const avgPhase = phaseData.reduce((a, b) => a + b, 0) / phaseData.length;
    
    // Calculate signal strength from magnitude
    const signalStrength = magnitude.reduce((a, b) => a + b, 0) / magnitude.length / 100;
    
    return {
      coherence,
      entropy,
      phase: avgPhase,
      dominantHz,
      harmonics,
      magnitude,
      signalStrength: Math.min(1, signalStrength),
      phaseVelocity: dominantHz * 2 * Math.PI, // ω = 2πf
    };
  } catch (error) {
    console.error('Plugin FFT failed:', error);
    return generateWithFallbackFFT(signal);
  }
}

/**
 * Standalone FFT using simple DFT for spectrum analysis (fallback)
 */
export function generateWithFallbackFFT(signal: Float64Array): SignalFrame {
  const N = signal.length;
  const magnitude: number[] = [];
  const phase: number[] = [];
  
  // Simple DFT for demo purposes (only compute first N/2 frequencies)
  for (let k = 0; k < N / 2; k++) {
    let real = 0;
    let imag = 0;
    
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      real += signal[n] * Math.cos(angle);
      imag -= signal[n] * Math.sin(angle);
    }
    
    magnitude.push(Math.sqrt(real * real + imag * imag));
    phase.push(Math.atan2(imag, real));
  }
  
  const coherence = calculateCoherence(magnitude);
  const entropy = calculateEntropy(magnitude);
  const dominantHz = findDominantFrequency(magnitude);
  const harmonics = extractHarmonics(magnitude, dominantHz);
  
  // Calculate average phase
  const avgPhase = phase.reduce((a, b) => a + b, 0) / phase.length;
  
  // Calculate signal strength from magnitude
  const signalStrength = magnitude.reduce((a, b) => a + b, 0) / magnitude.length / 100;
  
  return {
    coherence,
    entropy,
    phase: avgPhase,
    dominantHz,
    harmonics,
    magnitude,
    signalStrength: Math.min(1, signalStrength),
    phaseVelocity: dominantHz * 2 * Math.PI, // ω = 2πf
  };
}

/**
 * Analyze signal quality
 */
export function analyzeSignalQuality(frame: SignalFrame): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation: string;
} {
  const { coherence, entropy } = frame;
  
  // High coherence and low entropy = excellent
  if (coherence > 0.8 && entropy < 0.3) {
    return {
      quality: 'excellent',
      recommendation: 'Optimal conditions for execution',
    };
  }
  
  if (coherence > 0.6 && entropy < 0.5) {
    return {
      quality: 'good',
      recommendation: 'Favorable conditions',
    };
  }
  
  if (coherence > 0.4 && entropy < 0.7) {
    return {
      quality: 'fair',
      recommendation: 'Moderate conditions, consider waiting',
    };
  }
  
  return {
    quality: 'poor',
    recommendation: 'Unfavorable conditions, delay recommended',
  };
}

/**
 * Generate phase lock score (0-1)
 */
export function getPhaseLockScore(frame: SignalFrame): number {
  // Phase lock is high when coherence is high and entropy is low
  return frame.coherence * (1 - frame.entropy);
}
