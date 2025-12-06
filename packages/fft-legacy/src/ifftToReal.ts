// ifftToReal.ts
import { idft } from './idft';

export function ifft(phasors: [number, number][]): number[] {
  const result = idft(phasors);
  return result.map(([real]) => real);
}
