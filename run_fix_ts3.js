import fs from 'fs';

// Fix utils/audio.ts
let audio = fs.readFileSync('utils/audio.ts', 'utf8');
audio = audio.replace(/this\.playNoise\(0\.05, 0\.05, true, 'bandpass', 1200\);/g, "this.playNoise(0.05, 0.05, true);");
audio = audio.replace(/this\.playNoise\(0\.04, 0\.05, true, 'lowpass', 1000\);/g, "this.playNoise(0.04, 0.05, true);");
fs.writeFileSync('utils/audio.ts', audio);
