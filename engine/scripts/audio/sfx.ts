/** The NON STOP sound-effect palette. Each function returns a stereo buffer. */
import { buffer, lowpass, mix, pan, peakNormalize, reverb, rng, sat, svf, SR, type Stereo } from './dsp.ts';

const env = (t: number, attack: number, decay: number) =>
  t < attack ? t / attack : Math.exp(-(t - attack) / decay);

/** Sub drop + body + air burst + room. The one big hit of a film. */
export const impact = (): Stereo => {
  const out = buffer(3.2);
  const r = rng(11);
  const lp = lowpass();
  let phase = 0;
  for (let i = 0; i < out.L.length; i++) {
    const t = i / SR;
    const f = 34 + 80 * Math.exp(-t * 7);
    phase += (2 * Math.PI * f) / SR;
    const sub = Math.sin(phase) * env(t, 0.004, 0.9);
    const body = lp((r() * 2 - 1), 900 * Math.exp(-t * 3) + 120) * env(t, 0.001, 0.18) * 2.2;
    const air = (r() * 2 - 1) * env(t, 0.001, 0.05) * 0.5;
    const x = sat(sub * 1.1 + body + air, 1.6);
    out.L[i] = x;
    out.R[i] = x;
  }
  mix(out, reverb(out, 1.3, 0.5, 0), 0, 0.25);
  return peakNormalize(out, -1);
};

/** Air moving past the lens: band-passed noise sweep with a stereo pass. */
export const whoosh = (len = 0.8): Stereo => {
  const out = buffer(len + 0.3);
  const r = rng(23);
  const f = svf();
  for (let i = 0; i < out.L.length; i++) {
    const t = i / SR;
    const k = Math.min(1, t / len);
    const shape = Math.pow(Math.sin(Math.PI * k), 2.2);
    const cutoff = 350 + 2600 * Math.sin(Math.PI * Math.pow(k, 0.8));
    const y = f(r() * 2 - 1, cutoff, 0.5).band * shape * 1.4;
    const [l, rr] = pan(y, -0.8 + 1.6 * k);
    out.L[i] = l;
    out.R[i] = rr;
  }
  return peakNormalize(out, -3);
};

/** Tension riser: noise + rising tone, ends hard on its last sample (the cut). */
export const riser = (len = 1.9): Stereo => {
  const out = buffer(len);
  const r = rng(31);
  const f = svf();
  let ph1 = 0;
  let ph2 = 0;
  for (let i = 0; i < out.L.length; i++) {
    const t = i / SR;
    const k = t / len;
    const freq = 110 * Math.pow(8, k * k);
    ph1 += (2 * Math.PI * freq) / SR;
    ph2 += (2 * Math.PI * freq * 1.505) / SR;
    const tone = (Math.sin(ph1) + 0.5 * Math.sin(ph2) + 0.25 * Math.sin(ph1 * 2)) * 0.35;
    const noise = f(r() * 2 - 1, 400 + 7000 * k * k, 0.4).band;
    const amp = Math.pow(k, 2.2);
    const x = (tone + noise * 1.2) * amp;
    out.L[i] = x * (1 + 0.15 * Math.sin(t * 31));
    out.R[i] = x * (1 + 0.15 * Math.cos(t * 29));
  }
  return peakNormalize(out, -2);
};

/** Glass-like shimmer for light sweeps. */
export const shimmer = (): Stereo => {
  const dry = buffer(1.6);
  const r = rng(41);
  const partials = Array.from({ length: 7 }, () => ({ f: 2200 + r() * 4200, p: r() * 2 - 1, d: 0.25 + r() * 0.6, at: r() * 0.25 }));
  for (let i = 0; i < dry.L.length; i++) {
    const t = i / SR;
    for (const p of partials) {
      if (t < p.at) continue;
      const tt = t - p.at;
      const y = Math.sin(2 * Math.PI * p.f * tt) * env(tt, 0.01, p.d) * 0.18;
      const [l, rr] = pan(y, p.p);
      dry.L[i] += l;
      dry.R[i] += rr;
    }
  }
  const out = buffer(4);
  mix(out, dry, 0, 0.6);
  mix(out, reverb(dry, 1.4, 0.3, 0), 0, 0.9);
  return peakNormalize(out, -4);
};

/** Paper landing on paper: short filtered slap with a low thump. */
export const paper = (): Stereo => {
  const out = buffer(0.35);
  const r = rng(53);
  const f = svf();
  for (let i = 0; i < out.L.length; i++) {
    const t = i / SR;
    const slap = f(r() * 2 - 1, 2400, 0.9).high * env(t, 0.0015, 0.035);
    const thump = Math.sin(2 * Math.PI * 140 * t) * env(t, 0.002, 0.03) * 0.5;
    const x = slap + thump;
    out.L[i] = x;
    out.R[i] = x * 0.9;
  }
  return peakNormalize(out, -3);
};

/** Paper tear: gated crackle through a band-pass, fast then slowing. */
export const tear = (): Stereo => {
  const out = buffer(0.7);
  const r = rng(61);
  const f = svf();
  let gate = 0;
  for (let i = 0; i < out.L.length; i++) {
    const t = i / SR;
    if (r() < 0.004 * (1 - t)) gate = 1;
    gate *= 0.992;
    const y = f(r() * 2 - 1, 3200, 0.8).band * (0.35 + gate) * env(t, 0.005, 0.25);
    const [l, rr] = pan(y, -0.3 + t);
    out.L[i] = l;
    out.R[i] = rr;
  }
  return peakNormalize(out, -3);
};

/** A single point of light: soft bell with long room. */
export const glint = (): Stereo => {
  const dry = buffer(1.2);
  for (let i = 0; i < dry.L.length; i++) {
    const t = i / SR;
    const y = (Math.sin(2 * Math.PI * 1760 * t) * 0.6 + Math.sin(2 * Math.PI * 2637 * t) * 0.3 + Math.sin(2 * Math.PI * 3520 * t) * 0.1) * env(t, 0.004, 0.4);
    dry.L[i] = y * 0.8;
    dry.R[i] = y;
  }
  const out = buffer(4);
  mix(out, dry, 0, 0.5);
  mix(out, reverb(dry, 1.5, 0.25, 0), 0, 1);
  return peakNormalize(out, -6);
};

/** Soft low boom for logo arrivals. */
export const sub = (): Stereo => {
  const out = buffer(2);
  let ph = 0;
  for (let i = 0; i < out.L.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (42 + 22 * Math.exp(-t * 5))) / SR;
    const x = Math.sin(ph) * env(t, 0.03, 0.6);
    out.L[i] = x;
    out.R[i] = x;
  }
  return peakNormalize(out, -2);
};

/** Short punchy body hit for list items and beat-synced type. */
export const hit = (): Stereo => {
  const out = buffer(0.45);
  const r = rng(71);
  const f = svf();
  let ph = 0;
  for (let i = 0; i < out.L.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (55 + 120 * Math.exp(-t * 40))) / SR;
    const body = Math.sin(ph) * env(t, 0.002, 0.09);
    const snap = f(r() * 2 - 1, 1800, 0.8).band * env(t, 0.001, 0.025) * 1.5;
    const x = sat(body + snap, 1.8);
    out.L[i] = x;
    out.R[i] = x;
  }
  return peakNormalize(out, -2);
};

/** Tape rewind: warbling, pitch-swept noise for the rewind transition. */
export const rewind = (len = 0.65): Stereo => {
  const out = buffer(len);
  const r = rng(83);
  const f = svf();
  let ph = 0;
  for (let i = 0; i < out.L.length; i++) {
    const t = i / SR;
    const k = t / len;
    const freq = 900 + 2600 * Math.sin(Math.PI * k) + 400 * Math.sin(t * 90);
    ph += (2 * Math.PI * freq) / SR;
    const tone = Math.sin(ph) * 0.25;
    const noise = f(r() * 2 - 1, freq, 0.6).band;
    const a = Math.sin(Math.PI * k) * (0.7 + 0.3 * Math.sin(t * 140));
    const [l, rr] = pan((tone + noise) * a, -0.6 + 1.2 * k);
    out.L[i] = l;
    out.R[i] = rr;
  }
  return peakNormalize(out, -3);
};
