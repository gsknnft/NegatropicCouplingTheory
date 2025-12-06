#!/usr/bin/env tsx

import { fft } from './fft'
import * as fftutil from './fftutil'
import { Command } from 'commander';
import * as fs from 'fs';

const program = new Command();

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
  if (err) return console.error(err);

  const signal = data.split(',').map(Number);
  console.log('📊 Signal:', signal);

  const fftResult = fft(signal);
  console.log('🔁 FFT Coefficients:', fftResult);

  const magnitudes = fftutil.fftMag(fftResult);
  console.log('📈 Magnitudes:', magnitudes);

  const frequencies = fftutil.fftFreq(fftResult, sampleRate);
  console.log('📡 Frequencies:', frequencies);
});
