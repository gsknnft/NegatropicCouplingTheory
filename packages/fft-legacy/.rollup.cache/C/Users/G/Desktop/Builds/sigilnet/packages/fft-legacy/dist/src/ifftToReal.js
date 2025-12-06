"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifft = ifft;
// ifftToReal.ts
const idft_1 = require("./idft");
function ifft(phasors) {
    const result = (0, idft_1.idft)(phasors);
    return result.map(([real]) => real);
}
//# sourceMappingURL=ifftToReal.js.map