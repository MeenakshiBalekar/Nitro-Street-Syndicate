/**
 * Generates original, synthesized audio samples (mono 16-bit PCM WAV) into
 * assets/audio/. No third-party/copyrighted audio — everything is computed here.
 * Run: node scripts/genAudio.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 22050;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'audio');
mkdirSync(OUT, { recursive: true });

function wav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  return buf;
}

const TAU = Math.PI * 2;
const save = (name, samples) => {
  writeFileSync(join(OUT, name), wav(samples));
  console.log(`  ${name}  (${(samples.length / SR).toFixed(2)}s, ${samples.length} samples)`);
};

// --- engine loop: seamless because length is an exact multiple of the period --
function engine() {
  const period = 300; // 73.5 Hz fundamental
  const cycles = 36;
  const n = period * cycles;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const ph = ((i % period) / period) * TAU;
    let v =
      0.5 * Math.sin(ph) +
      0.32 * Math.sin(2 * ph + 0.3) +
      0.2 * Math.sin(3 * ph) +
      0.12 * Math.sin(5 * ph) +
      0.07 * Math.sin(7 * ph);
    v *= 1 + 0.12 * Math.sin(ph * 0.5); // period-aligned shimmer (even cycle count)
    out[i] = v * 0.42;
  }
  return out;
}

// --- nitro whoosh: rising filtered noise + sweep ------------------------------
function nitro() {
  const n = Math.floor(SR * 0.5);
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.min(1, t * 6) * Math.pow(1 - t, 1.4);
    const k = 0.02 + t * 0.25;
    lp += ((Math.random() * 2 - 1) - lp) * k;
    const sweep = 0.3 * Math.sin((TAU * (260 + 900 * t) * i) / SR);
    out[i] = (lp * 0.85 + sweep) * env * 0.7;
  }
  return out;
}

function crash() {
  const n = Math.floor(SR * 0.4);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const thump = Math.sin(TAU * 90 * t) * Math.exp(-t * 13);
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 9);
    out[i] = (thump * 0.9 + noise * 0.6) * 0.8;
  }
  return out;
}

function tone(freq, dur, type = 'sine', vol = 0.5) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 60) * Math.pow(1 - i / n, 1.5);
    const ph = TAU * freq * t;
    const s = type === 'square' ? Math.sign(Math.sin(ph)) : type === 'tri' ? Math.asin(Math.sin(ph)) * (2 / Math.PI) : Math.sin(ph);
    out[i] = s * env * vol;
  }
  return out;
}

function finish() {
  const notes = [
    [523, 0.0],
    [659, 0.12],
    [784, 0.24],
  ];
  const n = Math.floor(SR * 0.6);
  const out = new Float32Array(n);
  for (const [freq, start] of notes) {
    const s0 = Math.floor(start * SR);
    for (let i = s0; i < n; i++) {
      const t = (i - s0) / SR;
      const env = Math.min(1, t * 40) * Math.pow(1 - (i - s0) / (n - s0), 1.4);
      out[i] += Math.asin(Math.sin(TAU * freq * t)) * (2 / Math.PI) * env * 0.3;
    }
  }
  return out;
}

console.log('Generating audio →', OUT);
save('engine.wav', engine());
save('nitro.wav', nitro());
save('crash.wav', crash());
save('ui.wav', tone(1100, 0.05, 'square', 0.4));
save('countdown.wav', tone(760, 0.15, 'sine', 0.5));
save('go.wav', tone(1180, 0.3, 'sine', 0.55));
save('finish.wav', finish());
console.log('Done.');
