/**
 * Timeline-driven score. Sections are derived from the film's scene
 * types and cut on the exact frames the renderer uses (computeTimeline),
 * so musical changes land on picture changes by construction.
 */
import { computeTimeline } from '../../src/engine/scene/timeline.ts';
import { buffer, lowpass, mix, pan, peakNormalize, reverb, rng, sat, SR, type Stereo } from './dsp.ts';

type Scene = { id: string; type: string; duration: number; transition?: { type: string; duration: number } };
export type ScoreFilm = { scenes: Scene[] };

const NOTE = { D2: 73.42, F2: 87.31, A2: 110, Bb2: 116.54, C3: 130.81, D3: 146.83, F3: 174.61, Fs3: 185, A3: 220, C4: 261.63, D5: 587.33, F5: 698.46, A5: 880, C6: 1046.5 };

type Section = { type: string; start: number; end: number };

const CHORDS: Record<string, number[]> = {
  hook: [NOTE.D2, NOTE.D3, NOTE.A3],
  movement: [NOTE.D2, NOTE.D3, NOTE.F3, NOTE.A3],
  editorial: [NOTE.Bb2, NOTE.D3, NOTE.F3, NOTE.C4],
  impact: [NOTE.D2, NOTE.A2, NOTE.D3, NOTE.F3],
  statement: [NOTE.F2, NOTE.C3, NOTE.F3, NOTE.A3],
  outro: [NOTE.D2, NOTE.D3, NOTE.Fs3, NOTE.A3],
};
const CUTOFF: Record<string, [number, number]> = {
  hook: [260, 420],
  movement: [420, 700],
  editorial: [600, 2200],
  impact: [1400, 1100],
  statement: [700, 520],
  outro: [520, 300],
};

/** Detuned additive saw pad, cross-faded between sections. */
const pad = (out: Stereo, sections: Section[]) => {
  const lpL = lowpass();
  const lpR = lowpass();
  const total = out.L.length / SR;
  for (const [si, s] of sections.entries()) {
    const chord = CHORDS[s.type] ?? CHORDS.hook;
    const [c0, c1] = CUTOFF[s.type] ?? CUTOFF.hook;
    const fadeIn = si === 0 ? 1.5 : 0.6;
    const end = Math.min(total, s.end + 0.6);
    const tmp = buffer(end - s.start + 0.01);
    chord.forEach((f, ni) => {
      for (const [di, det] of [-0.11, 0, 0.13].entries()) {
        const freq = f * Math.pow(2, det / 12);
        const p = (ni / chord.length) * 1.2 - 0.6 + (di - 1) * 0.3;
        for (let i = 0; i < tmp.L.length; i++) {
          const t = i / SR;
          let y = 0;
          for (let h = 1; h <= 7; h++) y += Math.sin(2 * Math.PI * freq * h * t + h * di) / h;
          const [l, r] = pan(y * 0.05, p);
          tmp.L[i] += l;
          tmp.R[i] += r;
        }
      }
    });
    const len = s.end - s.start;
    for (let i = 0; i < tmp.L.length; i++) {
      const t = i / SR;
      const k = Math.min(1, t / Math.max(0.01, len));
      const cutoff = c0 + (c1 - c0) * k;
      const a = Math.min(1, t / fadeIn) * Math.min(1, Math.max(0, (end - s.start - t) / 0.6));
      tmp.L[i] = lpL(tmp.L[i], cutoff) * a;
      tmp.R[i] = lpR(tmp.R[i], cutoff) * a;
    }
    mix(out, tmp, s.start, s.type === 'impact' ? 1.25 : 1);
  }
};

const kick = (out: Stereo, at: number, gain: number) => {
  const k = buffer(0.5);
  let ph = 0;
  for (let i = 0; i < k.L.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (44 + 90 * Math.exp(-t * 28))) / SR;
    const y = sat(Math.sin(ph) * Math.exp(-t * 7), 1.5);
    k.L[i] = y;
    k.R[i] = y;
  }
  mix(out, k, at, gain);
};

const tick = (out: Stereo, at: number, gain: number, r: () => number) => {
  const k = buffer(0.05);
  for (let i = 0; i < k.L.length; i++) {
    const t = i / SR;
    const y = (Math.sin(2 * Math.PI * 4200 * t) * 0.6 + (r() * 2 - 1) * 0.4) * Math.exp(-t * 160);
    const [l, rr] = pan(y, 0.35);
    k.L[i] = l;
    k.R[i] = rr;
  }
  mix(out, k, at, gain);
};

const bass = (out: Stereo, start: number, end: number, beat: number, gain: number) => {
  const lp = lowpass();
  const pattern = [NOTE.D2, NOTE.D2, NOTE.F2, NOTE.D2, NOTE.A2 / 2 * 2, NOTE.D2, NOTE.C3 / 2, NOTE.D2];
  let ph = 0;
  const n0 = Math.round(start * SR);
  const n1 = Math.round(end * SR);
  for (let n = n0; n < n1 && n < out.L.length; n++) {
    const t = n / SR - start;
    const step = Math.floor(t / (beat / 2));
    const local = t - step * (beat / 2);
    const f = pattern[step % pattern.length];
    ph += (2 * Math.PI * f) / SR;
    let y = 0;
    for (let h = 1; h <= 6; h++) y += Math.sin(ph * h) / h;
    const a = Math.exp(-local * 5) * Math.min(1, local / 0.004);
    const v = lp(y, 380) * a * gain;
    out.L[n] += v;
    out.R[n] += v;
  }
};

const pings = (out: Stereo, start: number, end: number, every: number, gain: number, seed: number) => {
  const r = rng(seed);
  const notes = [NOTE.D5, NOTE.F5, NOTE.A5, NOTE.C6];
  for (let t = start + every * 0.5; t < end - 0.3; t += every) {
    const f = notes[Math.floor(r() * notes.length)];
    const p = buffer(1);
    const pp = r() * 1.4 - 0.7;
    for (let i = 0; i < p.L.length; i++) {
      const tt = i / SR;
      const y = (Math.sin(2 * Math.PI * f * tt) + 0.25 * Math.sin(2 * Math.PI * f * 2.01 * tt)) * Math.exp(-tt * 4) * Math.min(1, tt / 0.003);
      const [l, rr] = pan(y, pp);
      p.L[i] = l;
      p.R[i] = rr;
    }
    mix(out, p, t, gain);
  }
};

/** Pool-room ambience: slow-breathing filtered noise, decorrelated L/R. */
const water = (out: Stereo, gain: number) => {
  const rL = rng(7);
  const rR = rng(8);
  const lpL = lowpass();
  const lpR = lowpass();
  for (let i = 0; i < out.L.length; i++) {
    const t = i / SR;
    const swell = 0.6 + 0.4 * Math.sin(t * 0.9) * Math.sin(t * 0.37 + 1);
    out.L[i] += lpL(rL() * 2 - 1, 520) * gain * swell;
    out.R[i] += lpR(rR() * 2 - 1, 560) * gain * swell;
  }
};

export const buildScore = (film: ScoreFilm, fps: number, bpm = 120): Stereo => {
  const { entries, totalFrames } = computeTimeline(film, fps);
  const total = totalFrames / fps;
  // A section runs from the frame its scene becomes fully visible (after the incoming transition).
  const sections: Section[] = entries.map((e, i) => ({
    type: film.scenes[i].type,
    start: i === 0 ? 0 : (e.from + Math.round(e.transitionInFrames / 2)) / fps,
    end: i === entries.length - 1 ? total : (entries[i + 1].from + Math.round(entries[i + 1].transitionInFrames / 2)) / fps,
  }));
  const beat = 60 / bpm;
  const out = buffer(total);
  const music = buffer(total);
  const r = rng(99);

  pad(music, sections);
  for (const s of sections) {
    const next = sections[sections.indexOf(s) + 1];
    // Pre-impact vacuum: rhythm stops half a second before a hit.
    const stopAt = next?.type === 'impact' ? s.end - 0.5 : s.end;
    if (s.type === 'movement') for (let t = s.start; t < stopAt; t += beat) kick(music, t, 0.35);
    if (s.type === 'editorial') {
      for (let t = s.start; t < stopAt; t += beat) kick(music, t, 0.42);
      for (let t = s.start; t < stopAt; t += beat / 2) tick(music, t, 0.16, r);
    }
    if (s.type === 'impact') {
      for (let t = s.start + beat; t < s.end - beat; t += beat) kick(music, t, 0.6);
      bass(music, s.start, s.end - 0.2, beat, 0.38);
    }
    if (s.type === 'hook') pings(music, s.start + 1.2, s.end, beat * 3, 0.07, 3);
    if (s.type === 'statement') pings(music, s.start, s.end, beat * 2, 0.06, 5);
  }
  mix(out, music, 0, 1);
  mix(out, reverb(music, 1.2, 0.45, 0), 0, 0.35);
  water(out, 0.05);
  return peakNormalize(out, -3);
};

/** Free-running bed for composed films that have no dedicated score. */
export const ambientBed = (seconds: number): Stereo => {
  const out = buffer(seconds);
  pad(out, [{ type: 'hook', start: 0, end: seconds }]);
  water(out, 0.05);
  pings(out, 1, seconds, 1.5, 0.06, 13);
  return peakNormalize(out, -4);
};
