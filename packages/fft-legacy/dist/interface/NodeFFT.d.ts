export interface FFTImplementation {
    forward(input: Float64Array | number[]): {
        real: Float64Array | number[];
        imag: Float64Array | number[];
    };
    inverse(real: Float64Array | number[], imag: Float64Array | number[]): Float64Array;
}
export declare const NodeFFT: FFTImplementation;
