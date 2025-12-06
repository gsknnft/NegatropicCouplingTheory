import { FFTImplementation } from './fft-adapter';
export declare class Radix4FFT implements FFTImplementation {
    private readonly size;
    private readonly table;
    private readonly bitrev;
    constructor(size: number);
    private computeTwiddleTable;
    private computeBitReversal;
    /**
     * Performs an in-place FFT on a complex array.
     * Format: [real0, imag0, real1, imag1, ...]
     */
    forward(buffer: Float64Array): void;
}
//# sourceMappingURL=fft-radix4.d.ts.map