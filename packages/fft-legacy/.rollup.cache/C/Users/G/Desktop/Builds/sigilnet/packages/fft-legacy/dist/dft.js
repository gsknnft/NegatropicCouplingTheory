"use strict";
// /*===========================================================================*\
//  * Discrete Fourier Transform (O(n^2) brute-force method)
//  *
//  * (c) Vail Systems. Joshua Jung and Ben Bryan. 2015
//  *
//  * This code is not designed to be highly optimized but as an educational
//  * tool to understand the Fast Fourier Transform.
// \*===========================================================================*/
// import { Complex } from './types';
// import * as complex from './complex';
// import * as fftUtil from './fftutil';
// //------------------------------------------------
// // Note: this code is not optimized and is
// // primarily designed as an educational and testing
// // tool.
// //------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.dft = dft;
const tslib_1 = require("tslib");
const complex = tslib_1.__importStar(require("./complex"));
const fftUtil = tslib_1.__importStar(require("./fftutil"));
/**
 * Brute-force O(n^2) Discrete Fourier Transform.
 * Converts a real or complex signal to the frequency domain.
 */
function dft(vector) {
    const N = vector.length;
    const X = [];
    for (let k = 0; k < N; k++) {
        let sum = [0, 0];
        for (let i = 0; i < N; i++) {
            const val = typeof vector[i] === "number"
                ? [vector[i], 0]
                : vector[i];
            const exp = fftUtil.exponent(k * i, N);
            sum = complex.add(sum, complex.multiply(val, exp));
        }
        X[k] = sum;
    }
    return X;
}
//# sourceMappingURL=dft.js.map