// tests/fft.spec.ts
import { Radix4FFT } from '../src/fft-radix4';

test("FFT 4-point transform", () => {
  const fft = new Radix4FFT(4);
  const data = new Float64Array([
    1, 0,
    0, 0,
    -1, 0,
    0, 0
  ]);

  fft.forward(data);
  expect(data[0]).toBeCloseTo(0);
  expect(data[1]).toBeCloseTo(0);
});
