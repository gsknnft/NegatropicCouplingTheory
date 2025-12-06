#!/usr/bin/env tsx
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fft_1 = require("./fft");
const fftutil = tslib_1.__importStar(require("./fftutil"));
const commander_1 = require("commander");
const fs = tslib_1.__importStar(require("fs"));
const program = new commander_1.Command();
program
    .version('0.0.6')
    .usage('[options] [signal]')
    .option('-s, --sample-rate <sampleRate>', 'Sample rate [1000]', '1000')
    .parse(process.argv);
const sampleRate = parseFloat(program.opts().sampleRate);
if (isNaN(sampleRate)) {
    console.error('❌ Invalid sample rate!');
    program.outputHelp();
    process.exit(1);
}
const file = program.args[0];
if (!file) {
    console.error('❌ Please provide a signal file!');
    program.outputHelp();
    process.exit(1);
}
fs.readFile(file, 'utf8', (err, data) => {
    if (err)
        return console.error(err);
    const signal = data.split(',').map(Number);
    console.log('📊 Signal:', signal);
    const fftResult = (0, fft_1.fft)(signal);
    console.log('🔁 FFT Coefficients:', fftResult);
    const magnitudes = fftutil.fftMag(fftResult);
    console.log('📈 Magnitudes:', magnitudes);
    const frequencies = fftutil.fftFreq(fftResult, sampleRate);
    console.log('📡 Frequencies:', frequencies);
});
//# sourceMappingURL=main.js.map