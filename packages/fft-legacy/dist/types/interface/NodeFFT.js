"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeFFT = void 0;
const fft_1 = __importDefault(require("@sigilnet/fft-ts/core/fft-base/fft"));
exports.NodeFFT = {
    forward(input) {
        const processor = new fft_1.default(input);
        const out = processor.createComplexArray();
        const inComplex = processor.createComplexArray();
        for (let i = 0; i < input.length; i++) {
            inComplex[2 * i] = input[i];
            inComplex[2 * i + 1] = 0;
        }
        processor.transform(out, inComplex);
        const N = input.length;
        const real = new Array(N);
        const imag = new Array(N);
        for (let i = 0; i < N; i++) {
            real[i] = out[2 * i];
            imag[i] = out[2 * i + 1];
        }
        return { real, imag };
    },
    inverse(real, imag) {
        const N = real;
        const processor = new fft_1.default(N);
        const inComplex = processor.createComplexArray();
        for (let i = 0; i < N.length; i++) {
            inComplex[2 * i] = real[i];
            inComplex[2 * i + 1] = imag[i];
        }
        const out = processor.createComplexArray();
        processor.inverseTransform(out, inComplex);
        const result = new Float64Array(N);
        for (let i = 0; i < N.length; i++) {
            result[i] = out[2 * i];
        }
        return result;
    },
};
