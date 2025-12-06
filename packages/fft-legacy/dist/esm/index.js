Object.defineProperty(exports, "__esModule", { value: true });
exports.util = exports.ifft = exports.dft = exports.fft = void 0;
const tslib_1 = require("tslib");
var fft_1 = require("./fft");
Object.defineProperty(exports, "fft", { enumerable: true, get: function () { return fft_1.fft; } });
var dft_1 = require("./dft");
Object.defineProperty(exports, "dft", { enumerable: true, get: function () { return dft_1.dft; } });
var idft_1 = require("./idft");
Object.defineProperty(exports, "ifft", { enumerable: true, get: function () { return idft_1.idft; } });
exports.util = tslib_1.__importStar(require("./fftutil"));
//# sourceMappingURL=index.js.map
