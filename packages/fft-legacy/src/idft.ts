// idft.ts
import { Complex, Phasors } from './types/types';
import { dft } from './dft';

/**
 * Inverse Discrete Fourier Transform (brute-force O(n²))
 */
export function idft(signal: Phasors): Phasors {
  const csignal: Phasors = signal.map(([r, i]) => [i, r]);

  const ps = dft(csignal);

  return ps.map(([r, i]) => [i / ps.length, r / ps.length]);
}
