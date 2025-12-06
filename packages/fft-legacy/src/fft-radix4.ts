// fft-radix4.ts
import { Complex } from './types/types';
import { FFTImplementation } from './fft-adapter';

export class Radix4FFT implements FFTImplementation {
  private readonly size: number;
  private readonly table: Float64Array;
  private readonly bitrev: Uint16Array;

  constructor(size: number) {
    if (size <= 1 || (size & (size - 1)) !== 0) {
      throw new Error("FFT size must be a power of two and greater than 1");
    }

    this.size = size;
    this.table = this.computeTwiddleTable(size);
    this.bitrev = this.computeBitReversal(size);
  }

  private computeTwiddleTable(size: number): Float64Array {
    const table = new Float64Array(size * 2);
    for (let i = 0; i < size; i++) {
      const angle = (2 * Math.PI * i) / size;
      table[2 * i] = Math.cos(angle);
      table[2 * i + 1] = -Math.sin(angle);
    }
    return table;
  }

  private computeBitReversal(size: number): Uint16Array {
    const bits = Math.log2(size);
    const rev = new Uint16Array(size);
    for (let i = 0; i < size; i++) {
      let x = i;
      let y = 0;
      for (let j = 0; j < bits; j++) {
        y = (y << 1) | (x & 1);
        x >>>= 1;
      }
      rev[i] = y;
    }
    return rev;
  }

  /**
   * Performs an in-place FFT on a complex array.
   * Format: [real0, imag0, real1, imag1, ...]
   */
  forward(buffer: Float64Array): void {
    const N = this.size;
    const rev = this.bitrev;

    // Bit-reversal reordering
    for (let i = 0; i < N; i++) {
      const j = rev[i];
      if (i < j) {
        const ri = 2 * i, rj = 2 * j;
        const tmpR = buffer[ri], tmpI = buffer[ri + 1];
        buffer[ri] = buffer[rj]; buffer[ri + 1] = buffer[rj + 1];
        buffer[rj] = tmpR; buffer[rj + 1] = tmpI;
      }
    }

    // Cooley–Tukey decimation-in-time radix-2 FFT
    for (let len = 2; len <= N; len <<= 1) {
      const ang = -2 * Math.PI / len;
      const wlenR = Math.cos(ang), wlenI = Math.sin(ang);

      for (let i = 0; i < N; i += len) {
        let wr = 1, wi = 0;
        for (let j = 0; j < len / 2; j++) {
          const uR = buffer[2 * (i + j)];
          const uI = buffer[2 * (i + j) + 1];
          const vR = buffer[2 * (i + j + len / 2)];
          const vI = buffer[2 * (i + j + len / 2) + 1];

          const tR = wr * vR - wi * vI;
          const tI = wr * vI + wi * vR;

          buffer[2 * (i + j)] = uR + tR;
          buffer[2 * (i + j) + 1] = uI + tI;
          buffer[2 * (i + j + len / 2)] = uR - tR;
          buffer[2 * (i + j + len / 2) + 1] = uI - tI;

          const nextWR = wr * wlenR - wi * wlenI;
          wi = wr * wlenI + wi * wlenR;
          wr = nextWR;
        }
      }
    }
  }
}
