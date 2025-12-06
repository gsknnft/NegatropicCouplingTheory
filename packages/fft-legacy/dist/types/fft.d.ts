import { Complex } from './types/types';
export declare class FFT {
    size: number;
    vector: Float64Array;
    table: Float64Array;
    private _csize;
    private _width;
    private _bitrev;
    private _out;
    private _data;
    private _inv;
    data: Float64Array;
    freq: number;
    constructor(input: number[] | Float64Array);
    setInverse(inv: boolean): void;
    /**
     * Extract real parts from complex array
     */
    fromComplexArray(complex: Float64Array, storage?: Float64Array): Float64Array;
    /**
     * Create a complex array (interleaved real and imaginary parts)
     */
    createComplexArray(): Float64Array;
    bitReverse(i: number, bits: number): number;
    /**
     * Convert real array to complex array
     */
    toComplexArray(input: ArrayLike<number>, storage?: Float64Array): Float64Array;
    completeSpectrum(spectrum: Float64Array): Float64Array;
    /**
     * Forward FFT (complex to complex)
     */
    transform(out: Float64Array, data: Float64Array): void;
    /**
     * Real-valued FFT (optimized for real input)
     */
    realTransform(out: Float64Array, data: ArrayLike<number>): void;
    /**
     * Inverse FFT
     */
    inverseTransform(out: Float64Array, data: Float64Array): void;
    private _transform4;
    private _singleTransform2;
    private _singleTransform4;
    private _realTransform4;
    private _singleRealTransform2;
    private _singleRealTransform4;
}
export declare function fftFunc(vector: (number | Complex)[]): Complex[];
export declare function forwardMagnitudes(realData: Float64Array): Float64Array;
export declare function deriveCoherence(realData: Float64Array): number;
//# sourceMappingURL=fft.d.ts.map