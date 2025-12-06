import { Complex } from './types/types';
import * as complex from './complex';
import * as fftUtil from './fftutil';

export function fft(vector: (number | Complex)[]): Complex[] {
  const N = vector.length;
  const X: Complex[] = [];

  if (N === 1) {
    const val = vector[0];
    return [Array.isArray(val) ? [val[0], val[1]] : [val, 0]];
  }

  const even = (_: unknown, ix: number) => ix % 2 === 0;
  const odd = (_: unknown, ix: number) => ix % 2 === 1;

  const X_evens = fft(vector.filter(even));
  const X_odds = fft(vector.filter(odd));

  for (let k = 0; k < N / 2; k++) {
    const t = X_evens[k];
    const e = complex.multiply(fftUtil.exponent(k, N), X_odds[k]);

    X[k] = complex.add(t, e);
    X[k + N / 2] = complex.subtract(t, e);
  }

  return X;
}
