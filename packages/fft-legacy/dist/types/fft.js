"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fft = fft;
const complex = __importStar(require("./complex"));
const fftUtil = __importStar(require("./fftutil"));
function fft(vector) {
    const N = vector.length;
    const X = [];
    if (N === 1) {
        const val = vector[0];
        return [Array.isArray(val) ? [val[0], val[1]] : [val, 0]];
    }
    const even = (_, ix) => ix % 2 === 0;
    const odd = (_, ix) => ix % 2 === 1;
    const X_evens = fft(vector.filter(even));
    const X_odds = fft(vector.filter(odd));
    for (let k = 0; k < N / 2; k++) {
        const t = X_evens[k];
        const e = complex.multiply(fftUtil.exponent(k, N), X_odds[k]);
        X[k] = complex.add(t, e);
        X[k + N / 2] = complex.subtract(t, e);
    }
    return X;
}
