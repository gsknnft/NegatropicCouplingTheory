// fft-adapter.ts
export interface FFTImplementation {
  forward(buffer: Float64Array): void;
}


// import { fft as FFTJS } from './index';
// import { Radix2FFT } from './radix2';
// import { BluesteinFFT } from './bluestein';
// import { Radix4FFT } from './fft-radix4';

// export type FFTBackend = 'fftjs' | 'radix2' | 'radix4' | 'bluestein';

// export function createFFT(size: Float64Array, backend: FFTBackend = 'fftjs') {
//   switch (backend) {
//     case 'radix2': return new Radix2FFT(size);
//     case 'radix4': return new Radix4FFT(size);
//     // case 'bluestein': return new BluesteinFFT(size);
//     case 'fftjs': default: return FFTJS(size);
//   }
// }
