import { Complex } from './types/types';
import { fftFunc } from './fft';

export function ifft(signal: Complex[]): Complex[] {
  const csignal: Complex[] = signal.map(([r, i]) => [i, r]);
  const ps = fftFunc(csignal);
  return ps.map(([r, i]) => [i / ps.length, r / ps.length]);
}
