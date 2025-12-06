import { FFTImplementation } from './fft-adapter';
export declare class Radix4FFT implements FFTImplementation {
    private readonly size;
    private readonly table;
    private readonly bitrev;
    constructor(size: number);
    private computeTwiddleTable;
    private computeBitReversal;
    forward(buffer: Float64Array): void;
}
