import { Complex } from './types/types';
import * as complex from './complex';

const mapExponent: Record<number, Record<number, Complex>> = {};

export function exponent(k: number, N: number): Complex {
  const x = -2 * Math.PI * (k / N);
  mapExponent[N] ??= {};
  mapExponent[N][k] ??= [Math.cos(x), Math.sin(x)];
  return mapExponent[N][k];
}

export function fftMag(fftBins: Complex[]): number[] {
  return fftBins.map(complex.magnitude).slice(0, fftBins.length / 2);
}

export function fftFreq(fftBins: Complex[], sampleRate: number): number[] {
  const stepFreq = sampleRate / fftBins.length;
  return fftBins.slice(0, fftBins.length / 2).map((_, ix) => ix * stepFreq);
}
