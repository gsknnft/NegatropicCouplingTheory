'use strict';

Object.defineProperty(exports, "__esModule", { value: true });
exports.util = exports.ifft = exports.dft = exports.deriveCoherence = exports.forwardMagnitudes = exports.fftFunc = exports.FFT = void 0;
const tslib_1 = require("tslib");
var fft_1 = require("./fft");
Object.defineProperty(exports, "FFT", { enumerable: true, get: function () { return fft_1.FFT; } });
Object.defineProperty(exports, "fftFunc", { enumerable: true, get: function () { return fft_1.fftFunc; } });
Object.defineProperty(exports, "forwardMagnitudes", { enumerable: true, get: function () { return fft_1.forwardMagnitudes; } });
Object.defineProperty(exports, "deriveCoherence", { enumerable: true, get: function () { return fft_1.deriveCoherence; } });
var dft_1 = require("./dft");
Object.defineProperty(exports, "dft", { enumerable: true, get: function () { return dft_1.dft; } });
var idft_1 = require("./idft");
Object.defineProperty(exports, "ifft", { enumerable: true, get: function () { return idft_1.idft; } });
exports.util = tslib_1.__importStar(require("./fftutil"));
//# sourceMappingURL=index.cjs.map
