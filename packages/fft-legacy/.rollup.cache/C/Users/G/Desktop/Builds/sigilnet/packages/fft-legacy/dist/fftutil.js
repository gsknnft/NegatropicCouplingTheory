"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exponent = exponent;
exports.fftMag = fftMag;
exports.fftFreq = fftFreq;
const tslib_1 = require("tslib");
const complex = tslib_1.__importStar(require("./complex"));
const mapExponent = {};
function exponent(k, N) {
    const x = -2 * Math.PI * (k / N);
    mapExponent[N] ??= {};
    mapExponent[N][k] ??= [Math.cos(x), Math.sin(x)];
    return mapExponent[N][k];
}
function fftMag(fftBins) {
    return fftBins.map(complex.magnitude).slice(0, fftBins.length / 2);
}
function fftFreq(fftBins, sampleRate) {
    const stepFreq = sampleRate / fftBins.length;
    return fftBins.slice(0, fftBins.length / 2).map((_, ix) => ix * stepFreq);
}
//# sourceMappingURL=fftutil.js.map