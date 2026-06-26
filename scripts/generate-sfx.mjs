/**
 * Generates improved WAV assets for SoundManager asset pipeline.
 * Run: node scripts/generate-sfx.mjs
 *
 * M2 improvements (per AUDIO_SPEC): richer layered synthesis for "professional-grade" feel
 * within generated constraints. Multi-osc + noise + better envelopes + new juice sounds.
 * Still synthetic but much less "toy beep". Real foley recommended for 9+/10.
 */
import fs from 'fs';
import path from 'path';

const OUT = 'public/audio';
const SAMPLE_RATE = 22050; // keep small for bundle; 44.1k would be better for pro

function writeWav(filename, generator, durationSec) {
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const data = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const s = generator(t);
    const v = Math.max(-1, Math.min(1, s));
    data.writeInt16LE(Math.floor(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  const dataSize = data.length;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, filename), Buffer.concat([header, data]));
}

// Helpers for layered pro-ish synth
const clamp = (x) => Math.max(-1, Math.min(1, x));
const envExp = (t, decay) => Math.exp(-t * decay);
const envADSR = (t, a, d, s, r, dur) => {
  if (t < a) return t / a;
  if (t < a + d) return 1 - ((1 - s) * (t - a) / d);
  if (t < dur - r) return s;
  return s * (1 - (t - (dur - r)) / r);
};

console.log('Generating richer M2 SFX assets...');

// shoot: transient square + mid saw + noise tail (punchy sci-fi)
writeWav('shoot.wav', (t) => {
  const e = envExp(t, 22);
  const transient = Math.sign(Math.sin(2 * Math.PI * 1400 * t)) * envExp(t, 60) * 0.7;
  const body = Math.sin(2 * Math.PI * 620 * t) * 0.4 + Math.sin(2 * Math.PI * 310 * t) * 0.3;
  const tail = (Math.random() * 2 - 1) * envExp(t, 18) * 0.25;
  return clamp((transient + body + tail) * e * 0.65);
}, 0.09);

// splat: wet crunchy — low noise body + squelch sine sweep + high click (viscous feel)
writeWav('splat.wav', (t) => {
  const dur = 0.22;
  const e = envADSR(t, 0.003, 0.06, 0.35, 0.14, dur);
  const noise = (Math.random() * 2 - 1) * 0.85;
  const squelch = Math.sin(2 * Math.PI * (280 - t * 420) * t) * 0.6;
  const body = Math.sin(2 * Math.PI * 95 * t) * 0.55 + Math.sin(2 * Math.PI * 48 * t) * 0.4;
  const click = Math.sign(Math.sin(2 * Math.PI * 1800 * t)) * envExp(t, 95) * 0.35;
  return clamp((noise * 0.75 + squelch * 0.9 + body * 0.65 + click) * e * 0.72);
}, 0.22);

// ui_click: crisp high transient + short body
writeWav('ui_click.wav', (t) => {
  const e = envExp(t, 32);
  const click = Math.sign(Math.sin(2 * Math.PI * 1350 * t)) * envExp(t, 85) * 0.9;
  const body = Math.sin(2 * Math.PI * 1180 * t) * 0.45;
  return clamp((click + body) * e * 0.6);
}, 0.045);

// ui_hover: soft airy sine + slight noise
writeWav('ui_hover.wav', (t) => {
  const e = envExp(t, 38);
  const tone = Math.sin(2 * Math.PI * 620 * t) * 0.6 + Math.sin(2 * Math.PI * 1240 * t) * 0.25;
  const air = (Math.random() * 2 - 1) * envExp(t, 28) * 0.2;
  return clamp((tone + air) * e * 0.55);
}, 0.035);

// powerup: layered ascending harmonic bloom (richer than single sine)
writeWav('powerup.wav', (t) => {
  const dur = 0.28;
  const e = envADSR(t, 0.01, 0.08, 0.6, 0.12, dur);
  const l1 = Math.sin(2 * Math.PI * 440 * t);
  const l2 = Math.sin(2 * Math.PI * 660 * t) * 0.7;
  const l3 = Math.sin(2 * Math.PI * 880 * t + 0.4) * 0.5;
  const l4 = Math.sin(2 * Math.PI * 1320 * t) * 0.35;
  return clamp((l1 + l2 + l3 + l4) * e * 0.48);
}, 0.28);

// hit_base: deep sub + transient click + rumble tail (structural impact)
writeWav('hit_base.wav', (t) => {
  const dur = 0.32;
  const e = envADSR(t, 0.002, 0.09, 0.4, 0.18, dur);
  const sub = Math.sin(2 * Math.PI * 52 * t) * 0.95;
  const click = Math.sign(Math.sin(2 * Math.PI * 210 * t)) * envExp(t, 70) * 0.5;
  const rumble = (Math.random() * 2 - 1) * envExp(t, 9) * 0.3;
  return clamp((sub + click + rumble) * e * 0.78);
}, 0.32);

// boss_warning: ominous pulsing low square with harmonic + glitch overtone
writeWav('boss_warning.wav', (t) => {
  const dur = 0.65;
  const e = envADSR(t, 0.005, 0.12, 0.75, 0.22, dur);
  const pulse = Math.sign(Math.sin(2 * Math.PI * 78 * t)) * 0.85;
  const harm = Math.sin(2 * Math.PI * 156 * t) * 0.4;
  const glitch = (Math.random() * 2 - 1) * envExp(t * 0.8, 4) * 0.18;
  return clamp((pulse + harm + glitch) * e * 0.62);
}, 0.65);

// === NEW M2 JUICE ASSETS (for hitstop, combo, wave) ===

// hitstop: low thump with noise punch + short tail (impact freeze weight)
writeWav('hitstop.wav', (t) => {
  const dur = 0.18;
  const e = envADSR(t, 0.001, 0.035, 0.15, 0.1, dur);
  const sub = Math.sin(2 * Math.PI * 48 * t) * 0.9;
  const punch = (Math.random() * 2 - 1) * envExp(t, 55) * 0.65;
  const tail = Math.sin(2 * Math.PI * 28 * t) * envExp(t, 6) * 0.35;
  return clamp((sub + punch + tail) * e * 0.82);
}, 0.18);

// combo_ping: bright escalating harmonic sparkle for tiers
writeWav('combo_ping.wav', (t) => {
  const dur = 0.16;
  const e = envADSR(t, 0.002, 0.025, 0.4, 0.09, dur);
  const base = Math.sin(2 * Math.PI * 1240 * t) * 0.6;
  const h1 = Math.sin(2 * Math.PI * 1860 * t) * 0.5;
  const h2 = Math.sin(2 * Math.PI * 2480 * t) * 0.35;
  const air = (Math.random() * 2 - 1) * envExp(t, 22) * 0.18;
  return clamp((base + h1 + h2 + air) * e * 0.55);
}, 0.16);

// wave_transition: ascending sweep + clean resolve (wave start/complete cue)
writeWav('wave_transition.wav', (t) => {
  const dur = 0.55;
  const e = envADSR(t, 0.02, 0.15, 0.65, 0.25, dur);
  const sweep = Math.sin(2 * Math.PI * (420 + t * 680) * t) * 0.7;
  const tone = Math.sin(2 * Math.PI * 720 * t) * 0.45 + Math.sin(2 * Math.PI * 1080 * t) * 0.3;
  const noiseTail = (Math.random() * 2 - 1) * envExp(t, 5) * 0.12;
  return clamp((sweep + tone + noiseTail) * e * 0.58);
}, 0.55);

console.log('Generated improved + new M2 SFX in', OUT);
console.log('Assets: shoot, splat, ui_*, powerup, hit_base, boss_warning, hitstop, combo_ping, wave_transition');
