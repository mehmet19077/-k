import type { TransitionSpec } from '../engine/scene/schema';
import type { storyModes } from '../film/schema';

/**
 * Story modes. The narrative arc is always drawn from the same six beats
 * (Hook → Problem → Development → Impact → Resolution → Ending); a mode
 * decides which beats it uses, how long each one breathes, how beats
 * hand over to each other and how the finish looks.
 */
export type Beat = 'hook' | 'problem' | 'development' | 'impact' | 'resolution' | 'ending';
export type StoryMode = (typeof storyModes)[number];

export type ModePreset = {
  /** Beats in order with relative duration weights. */
  arc: { beat: Beat; weight: number }[];
  /** Transition into each beat (missing = cut). */
  handover: Partial<Record<Beat, TransitionSpec>>;
  grain: number;
  vignette: number;
  description: string;
};

const flash = (d = 0.3): TransitionSpec => ({ type: 'flash', duration: d });
const whip = (d = 0.4, direction: TransitionSpec['direction'] = 'left'): TransitionSpec => ({ type: 'whip', duration: d, direction });
const dissolve = (d = 0.9): TransitionSpec => ({ type: 'dissolve', duration: d });
const push = (d = 0.8): TransitionSpec => ({ type: 'push', duration: d });
const wipe = (d = 0.6): TransitionSpec => ({ type: 'wipe', duration: d });

const FULL: Beat[] = ['hook', 'development', 'problem', 'impact', 'resolution', 'ending'];
const arc = (beats: Beat[], weights: number[]) => beats.map((beat, i) => ({ beat, weight: weights[i] }));

export const MODES: Record<StoryMode, ModePreset> = {
  cinematic: {
    arc: arc(FULL, [1.1, 1.0, 1.15, 0.9, 1.0, 1.05]),
    handover: { development: dissolve(0.8), problem: whip(), resolution: push(), ending: dissolve() },
    grain: 0.085,
    vignette: 0.62,
    description: 'Long breaths, light-led transitions, one hard hit.',
  },
  sports: {
    arc: arc(FULL, [0.8, 1.0, 1.0, 1.0, 0.9, 0.9]),
    handover: { development: whip(0.35, 'up'), problem: whip(0.35), resolution: push(0.6), ending: dissolve(0.6) },
    grain: 0.07,
    vignette: 0.55,
    description: 'Momentum: whips carry direction, impact lands early.',
  },
  energetic: {
    arc: arc(FULL, [0.6, 0.8, 0.8, 1.0, 0.7, 0.8]),
    handover: { development: whip(0.3), problem: whip(0.3, 'right'), impact: flash(0.2), resolution: whip(0.3, 'up'), ending: flash(0.3) },
    grain: 0.06,
    vignette: 0.5,
    description: 'Short beats, constant motion, flashes on hits.',
  },
  editorial: {
    arc: arc(['hook', 'problem', 'development', 'resolution', 'ending'], [0.9, 1.3, 1.1, 1.0, 0.9]),
    handover: { problem: wipe(), development: wipe(0.5), resolution: dissolve(0.7), ending: dissolve() },
    grain: 0.1,
    vignette: 0.5,
    description: 'Collage and print: wipes, paper, measured reading time.',
  },
  documentary: {
    arc: arc(['hook', 'development', 'problem', 'resolution', 'ending'], [1.0, 1.3, 1.2, 1.1, 0.9]),
    handover: { development: dissolve(), problem: dissolve(0.7), resolution: dissolve(), ending: dissolve() },
    grain: 0.1,
    vignette: 0.66,
    description: 'Observational: dissolves only, slow camera, no hits.',
  },
  emotional: {
    arc: arc(['hook', 'development', 'resolution', 'ending'], [1.2, 1.3, 1.4, 1.1]),
    handover: { development: dissolve(1.1), resolution: dissolve(1.2), ending: dissolve(1.2) },
    grain: 0.09,
    vignette: 0.7,
    description: 'Slow focus pulls and long dissolves; text arrives late.',
  },
  minimal: {
    arc: arc(['hook', 'resolution', 'ending'], [1.0, 1.2, 1.0]),
    handover: { resolution: dissolve(0.8), ending: dissolve(0.9) },
    grain: 0.06,
    vignette: 0.55,
    description: 'Three beats. Space is the design.',
  },
  educational: {
    arc: arc(['hook', 'problem', 'development', 'resolution', 'ending'], [0.8, 1.2, 1.3, 1.2, 0.8]),
    handover: { problem: wipe(0.5), development: whip(0.4), resolution: dissolve(0.6), ending: dissolve(0.6) },
    grain: 0.05,
    vignette: 0.45,
    description: 'Clear chapters, readable holds, little grain.',
  },
  brand: {
    arc: arc(['hook', 'development', 'impact', 'ending'], [1.0, 1.1, 0.9, 1.3]),
    handover: { development: dissolve(0.7), impact: flash(0.25), ending: push(0.8) },
    grain: 0.07,
    vignette: 0.6,
    description: 'Product-first: build, one hit, long lock-up.',
  },
};
