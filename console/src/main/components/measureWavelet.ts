import { wavedec, waverec, Wasmlet, init } from '@sigilnet/qwave';
import { applyHannWindow } from './services/windows';

interface WaveletMeasureOptions {
  waveletLevel?: number;
  waveletName?: Wasmlet;
}

// Returns coherence proxy (1 - normalized entropy over wavelet energy distribution)
export async function waveletMeasure(
  samples: Float64Array,
  opts?: WaveletMeasureOptions,
): Promise<number> {
  try {
    await init();
    const level =
      opts?.waveletLevel ??
      Math.max(1, Math.floor(Math.log2(samples.length)) - 2);
    const windowed =
      (applyHannWindow(samples, false) as Float64Array) ?? samples;
    const coeffs = wavedec(windowed, opts?.waveletName ?? 'haar', 'sym', level);
    const flat: number[] = [];
    if (coeffs && Array.isArray(coeffs)) {
      coeffs.forEach((c: any) => {
        if (Array.isArray(c)) {
          c.forEach((v) => flat.push(typeof v === 'number' ? v : 0));
        } else if (typeof c === 'number') {
          flat.push(c);
        }
      });
    } else if (coeffs && typeof coeffs === 'object') {
      Object.values(coeffs).forEach((v: any) => {
        if (Array.isArray(v)) {
          v.forEach((x) => flat.push(typeof x === 'number' ? x : 0));
        }
      });
    }
    const energy = flat.map((v) => v * v);
    const total = energy.reduce((acc, v) => acc + v, 0);
    if (total <= 0 || energy.length === 0) return 0;
    const probs = energy.map((e) => e / total);
    const entropy = -probs.reduce(
      (sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0),
      0,
    );
    const normEntropy = entropy / Math.log2(Math.max(2, probs.length));
    return Math.max(0, Math.min(1, 1 - normEntropy));
  } catch (err) {
    console.warn(
      'QWave measure failed, falling back to wavelet coherence',
      err,
    );
    return waveletCoherence(samples);
  }
}

export function waveletCoherence(samples: Float64Array): number {
  if (samples.length < 2) return 0;
  const n = samples.length - (samples.length % 2);
  if (n < 2) return 0;
  const approx: number[] = [];
  const detail: number[] = [];
  for (let i = 0; i < n; i += 2) {
    const a = (samples[i] + samples[i + 1]) / Math.SQRT2;
    const d = (samples[i] - samples[i + 1]) / Math.SQRT2;
    approx.push(a);
    detail.push(d);
  }
  const energy = [...approx, ...detail].map((v) => v * v);
  const total = energy.reduce((acc, v) => acc + v, 0);
  if (total <= 0) return 0;
  const probs = energy.map((e) => e / total);
  const entropy = -probs.reduce(
    (sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0),
    0,
  );
  const normEntropy = entropy / Math.log2(probs.length);
  return Math.max(0, Math.min(1, 1 - normEntropy));
}
