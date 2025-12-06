import {FFT} from "../fft";

export interface FFTImplementation {
  forward(input: Float64Array | number[]): { real: Float64Array | number[]; imag: Float64Array | number[] };
  inverse(real: Float64Array | number[], imag: Float64Array | number[]): Float64Array;
}

export const NodeFFT: FFTImplementation = {
  forward(input) {
    const processor = new FFT(input);
    const out = processor.createComplexArray();
    const inComplex = processor.createComplexArray();

    for (let i = 0; i < input.length; i++) {
      inComplex[2 * i] = input[i];
      inComplex[2 * i + 1] = 0;
    }

    processor.transform(out, inComplex);

    const N = input.length;
    const real = new Array(N);
    const imag = new Array(N);

    for (let i = 0; i < N; i++) {
      real[i] = out[2 * i];
      imag[i] = out[2 * i + 1];
    }
    return { real, imag };
  },
  inverse(real, imag) {
    const N = real;
    const processor = new FFT(N);
    const inComplex = processor.createComplexArray();
    for (let i = 0; i < N.length; i++) {
      inComplex[2 * i] = real[i];
      inComplex[2 * i + 1] = imag[i];
    }
    const out = processor.createComplexArray();
    processor.inverseTransform(out, inComplex);
    const result = new Float64Array(N);
    for (let i = 0; i < N.length; i++) {
      result[i] = out[2 * i];
    }
    return result;
  },
};
