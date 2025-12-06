#!/usr/bin/env tsx
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
const fft_1 = require("./fft");
const fftutil = __importStar(require("./fftutil"));
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
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
