// fft-adapter.ts
export interface FFTImplementation {
  forward(buffer: Float64Array): void;
}


// import { FFT as FFTJS } from '../../fft/src/';
// import { Radix2FFT } from '../radix2';
// import { BluesteinFFT } from '../bluestein';
// import { Radix4FFT } from '../radix4';

// export type FFTBackend = 'fftjs' | 'radix2' | 'radix4' | 'bluestein';

// export function createFFT(size: number, backend: FFTBackend = 'fftjs') {
//   switch (backend) {
//     case 'radix2': return new Radix2FFT(size);
//     case 'radix4': return new Radix4FFT(size);
//     case 'bluestein': return new BluesteinFFT(size);
//     case 'fftjs': default: return new FFTJS(size);
//   }
// }
