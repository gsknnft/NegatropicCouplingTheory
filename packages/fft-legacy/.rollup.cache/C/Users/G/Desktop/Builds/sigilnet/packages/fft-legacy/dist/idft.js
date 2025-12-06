"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idft = idft;
const dft_1 = require("./dft");
/**
 * Inverse Discrete Fourier Transform (brute-force O(n²))
 */
function idft(signal) {
    const csignal = signal.map(([r, i]) => [i, r]);
    const ps = (0, dft_1.dft)(csignal);
    return ps.map(([r, i]) => [i / ps.length, r / ps.length]);
}
//# sourceMappingURL=idft.js.map