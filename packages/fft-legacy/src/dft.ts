// /*===========================================================================*\
//  * Discrete Fourier Transform (O(n^2) brute-force method)
//  *
//  * (c) Vail Systems. Joshua Jung and Ben Bryan. 2015
//  *
//  * This code is not designed to be highly optimized but as an educational
//  * tool to understand the Fast Fourier Transform.
// \*===========================================================================*/
// import { Complex } from './types';
// import * as complex from './complex';
// import * as fftUtil from './fftutil';
// //------------------------------------------------
// // Note: this code is not optimized and is
// // primarily designed as an educational and testing
// // tool.
// //------------------------------------------------

// //-------------------------------------------------
// // Calculate brute-force O(n^2) DFT for vector.
// //-------------------------------------------------

// dft.ts
import { Complex, Phasors } from './types/types';
import * as complex from './complex';
import * as fftUtil from './fftutil';

/**
 * Brute-force O(n^2) Discrete Fourier Transform.
 * Converts a real or complex signal to the frequency domain.
 */
export function dft(vector: number[] | Complex[]): Phasors {
  const N = vector.length;
  const X: Phasors = [];

  for (let k = 0; k < N; k++) {
    let sum: Complex = [0, 0];

    for (let i = 0; i < N; i++) {
      const val: Complex =
        typeof vector[i] === "number"
          ? [vector[i] as number, 0]
          : (vector[i] as Complex);

      const exp = fftUtil.exponent(k * i, N);
      sum = complex.add(sum, complex.multiply(val, exp));
    }

    X[k] = sum;
  }

  return X;
}
