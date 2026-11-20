/**
 * Minimal offline DSP for the NON STOP sound palette. Everything is
 * synthesised from code (no samples), so the audio carries no third-party
 * licence and is identical on every machine.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const SR = 48000;

export type Stereo = { L: Float32Array; R: Float32Array };

export const buffer = (seconds: number): Stereo => {
  const n = Math.ceil(seconds * SR);
  return { L: new Float32Array(n), R: new Float32Array(n) };
};

/** Seeded PRNG (mulberry32) so every render of the audio is identical. */
export const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** One-pole low-pass, cutoff may vary per sample. */
export const lowpass = () => {
  let y = 0;
  return (x: number, cutoff: number) => {
    const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
    y += a * (x - y);
    return y;
  };
};

/** State-variable filter (Chamberlin), returns band-pass and low-pass. */
export const svf = () => {
  let low = 0;
  let band = 0;
  return (x: number, cutoff: number, q = 0.7) => {
    const f = 2 * Math.sin((Math.PI * Math.min(cutoff, SR / 6)) / SR);
    low += f * band;
    const high = x - low - q * band;
    band += f * high;
    return { low, band, high };
  };
};

export const pan = (x: number, p: number): [number, number] => {
  const a = ((p + 1) * Math.PI) / 4;
  return [x * Math.cos(a), x * Math.sin(a)];
};

/** Add `src` into `dst` starting at second `at`, with gain. */
export const mix = (dst: Stereo, src: Stereo, at: number, gain = 1) => {
  const o = Math.round(at * SR);
  for (let i = 0; i < src.L.length; i++) {
    const j = o + i;
    if (j < 0 || j >= dst.L.length) continue;
    dst.L[j] += src.L[i] * gain;
    dst.R[j] += src.R[i] * gain;
  }
};

/** Schroeder reverb (4 combs + 2 all-pass per side), wet-only output. */
export const reverb = (src: Stereo, size = 1, damp = 0.4, tail = 2.5): Stereo => {
  const out = buffer(src.L.length / SR + tail);
  const side = (input: Float32Array, output: Float32Array, spread: number) => {
    const combs = [1557, 1617, 1491, 1422].map((d) => {
      const len = Math.round((d + spread) * size);
      return { buf: new Float32Array(len), i: 0, store: 0 };
    });
    const aps = [556, 441].map((d) => ({ buf: new Float32Array(d + spread), i: 0 }));
    for (let n = 0; n < output.length; n++) {
      const x = n < input.length ? input[n] : 0;
      let acc = 0;
      for (const c of combs) {
        const y = c.buf[c.i];
        c.store = y * (1 - damp) + c.store * damp;
        c.buf[c.i] = x + c.store * 0.84;
        c.i = (c.i + 1) % c.buf.length;
        acc += y;
      }
      let y = acc * 0.25;
      for (const a of aps) {
        const b = a.buf[a.i];
        a.buf[a.i] = y + b * 0.5;
        y = b - y * 0.5;
        a.i = (a.i + 1) % a.buf.length;
      }
      output[n] = y;
    }
  };
  side(src.L, out.L, 0);
  side(src.R, out.R, 23);
  return out;
};

/** Soft saturation. */
export const sat = (x: number, drive = 1) => Math.tanh(x * drive) / Math.tanh(drive);

export const peakNormalize = (s: Stereo, peakDb = -1) => {
  let peak = 0;
  for (let i = 0; i < s.L.length; i++) peak = Math.max(peak, Math.abs(s.L[i]), Math.abs(s.R[i]));
  if (peak === 0) return s;
  const g = Math.pow(10, peakDb / 20) / peak;
  for (let i = 0; i < s.L.length; i++) {
    s.L[i] *= g;
    s.R[i] *= g;
  }
  return s;
};

export const writeWav = (path: string, s: Stereo) => {
  const n = s.L.length;
  const data = Buffer.alloc(44 + n * 4);
  data.write('RIFF', 0);
  data.writeUInt32LE(36 + n * 4, 4);
  data.write('WAVE', 8);
  data.write('fmt ', 12);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(2, 22);
  data.writeUInt32LE(SR, 24);
  data.writeUInt32LE(SR * 4, 28);
  data.writeUInt16LE(4, 32);
  data.writeUInt16LE(16, 34);
  data.write('data', 36);
  data.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, s.L[i]));
    const r = Math.max(-1, Math.min(1, s.R[i]));
    data.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    data.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
};
