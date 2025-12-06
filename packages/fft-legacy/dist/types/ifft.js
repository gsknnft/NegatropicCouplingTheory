"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifft = ifft;
const fft_1 = require("./fft");
function ifft(signal) {
    const csignal = signal.map(([r, i]) => [i, r]);
    const ps = (0, fft_1.fft)(csignal);
    return ps.map(([r, i]) => [i / ps.length, r / ps.length]);
}
