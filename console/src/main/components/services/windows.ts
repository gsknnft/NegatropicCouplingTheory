/**
 * Applies a Hann window to a Float64Array of input samples, in-place or returning a new array.
 * @param input - the samples to window
 * @param inPlace - if true, modifies input in-place; else, returns a new Float64Array
 * @returns the windowed data (if not in-place), else undefined
 */
function applyHannWindow(
  input: Float64Array,
  inPlace = false
): Float64Array {
  const N = input.length;
  if (N <= 2) {
    if (inPlace) return padToThePowerOfTwo(input);
    return padToThePowerOfTwo(input);
  }

  if (inPlace) {
    for (let n = 0; n < N; n++) {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
      input[n] *= w;
    }
    return input;
  } else {
    const output = new Float64Array(N);
    for (let n = 0; n < N; n++) {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
      output[n] = input[n] * w;
    }
    return output;
  }
}

function hannWindowCoefficients(N: number): Float64Array {
  const window = new Float64Array(N);
  for (let n = 0; n < N; n++) {
    window[n] = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
  }
  return window;
}



export { applyHannWindow, hannWindowCoefficients };



/**
 * Pads a Float64Array to the next power of two length with zeros.
 * @param input - the input Float64Array
 * @returns a new Float64Array padded to the next power of two length
 */
function padToThePowerOfTwo(input: Float64Array): Float64Array {
  const N = input.length;
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(N)));
  if (N === nextPow2) return new Float64Array(input); // Already power of two
  const padded = new Float64Array(nextPow2);
  padded.set(input);
  return padded;
}
// Apply: elementwise multiplication (can use for samples, frames, overlap-add, etc.)

// const samples = new Float64Array([/* ... */]);
// const windowed = applyHannWindow(samples); // returns a newly-windowed array
// Or: applyHannWindow(samples, true); // modifies `samples` in-place
/* 
const energyBefore = sum(signal.map(x => x*x));
const energyAfter  = sum(windowed.map(x => x*x));
console.log(`Energy ratio: ${(energyAfter/energyBefore).toFixed(3)}`);
**For a Hann window it should be ≈ 0.375 (so if you ever need absolute amplitude, multiply by 1/0.375 ≈ 2.67).
*/

/* 
// Define N with a suitable value, e.g., the length of the signal you want to window
const N = 1024; // or set this dynamically as needed
const hannCoeffs = hannWindowCoefficients(N);
function applyPrecomputedHann(signal: Float64Array, coeffs: Float64Array): void {
  for (let i = 0; i < N; i++) signal[i] *= coeffs[i];
}

const windowCoeffs = hannWindowCoefficients(N);
function realTimeWindowedFFT(input: Float64Array, fftFunction: (data: Float64Array) => any) {
  // If using WASM FFT expecting Float32Array, convert as necessary
  for (let i = 0; i < N; i++) fftIn[i] = input[i] * windowCoeffs[i]; // fftIn can be Float32Array
  return fftFunction(fftIn);
}
*/
