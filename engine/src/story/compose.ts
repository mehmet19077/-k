import { computeTimeline } from '../engine/scene/timeline';
import type { FilmSpec } from '../film/schema';
import type { SceneSpec } from '../scenes';
import { MODES, type Beat, type StoryMode } from './modes';

/**
 * Story composer: a short brief in, a complete FilmSpec out. Durations
 * are distributed by the mode's weights and corrected so the film lands
 * exactly on the requested length after transition overlaps.
 */
export type Brief = {
  title: string;
  mode: StoryMode;
  /** Target length in seconds. */
  duration: number;
  fps: number;
  logo: string;
  copy: {
    hook: { kicker: string; title: string };
    problem?: { word: string; line: string; labels: string[]; question: [string, string] };
    development?: { kicker: string; lines: string[]; numeral?: string };
    impact?: { word: string; kicker: string };
    resolution: { lines: string[]; emphasis?: number };
    ending: { wordmark: string; tagline: string };
  };
};

const SOUND: Partial<Record<Beat, SceneSpec['sound']>> = {
  hook: [{ src: 'sfx/glint.wav', at: 0.3, volume: 0.45 }],
  impact: [
    { src: 'sfx/impact.wav', at: 0, volume: 1 },
    { src: 'sfx/shimmer.wav', at: 1.15, volume: 0.3 },
  ],
  ending: [
    { src: 'sfx/sub.wav', at: 0.25, volume: 0.6 },
    { src: 'sfx/shimmer.wav', at: 1.6, volume: 0.45 },
  ],
};

const toScene = (beat: Beat, brief: Brief, duration: number): SceneSpec | null => {
  const c = brief.copy;
  const base = { id: beat, duration, sound: SOUND[beat] };
  switch (beat) {
    case 'hook':
      return { ...base, type: 'hook', ...c.hook };
    case 'development':
      return c.development ? { ...base, type: 'movement', speed: 3.2, ...c.development } : null;
    case 'problem':
      return c.problem ? { ...base, type: 'editorial', breakAt: duration * 0.58, ...c.problem } : null;
    case 'impact':
      return c.impact ? { ...base, type: 'impact', hit: 0, ...c.impact } : null;
    case 'resolution':
      return { ...base, type: 'statement', start: 0.6, emphasis: c.resolution.emphasis ?? -1, lines: c.resolution.lines };
    case 'ending':
      return { ...base, type: 'outro', logo: brief.logo, logoSize: 520, fadeOut: 0.9, ...c.ending };
  }
};

export const composeFilm = (brief: Brief): FilmSpec => {
  const mode = MODES[brief.mode];
  const beats = mode.arc.filter(({ beat }) => toScene(beat, brief, 1) !== null);
  const overlap = beats.reduce((sum, { beat }, i) => {
    const tr = mode.handover[beat];
    return i === 0 || !tr || tr.type === 'cut' ? sum : sum + tr.duration;
  }, 0);
  const totalWeight = beats.reduce((s, b) => s + b.weight, 0);
  const budget = brief.duration + overlap;

  const scenes = beats.map(({ beat, weight }, i) => {
    const d = Math.round(((budget * weight) / totalWeight) * brief.fps) / brief.fps;
    const scene = toScene(beat, brief, d) as SceneSpec;
    const tr = mode.handover[beat];
    return i > 0 && tr ? { ...scene, transition: tr } : scene;
  });

  // Absorb frame rounding in the last scene so the length is exact.
  const { totalFrames } = computeTimeline({ scenes }, brief.fps);
  const target = Math.round(brief.duration * brief.fps);
  const last = scenes[scenes.length - 1];
  last.duration = Math.round(last.duration * brief.fps + (target - totalFrames)) / brief.fps;

  return {
    title: brief.title,
    mode: brief.mode,
    style: 'dark-cinematic',
    music: { src: 'audio/ambient-bed.wav', volume: 0.8, fadeIn: 0.5, fadeOut: 1.2 },
    finish: { grain: mode.grain, vignette: mode.vignette },
    scenes,
  };
};
