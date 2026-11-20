/**
 * Central timing system. Films are written in seconds and beats, never
 * in raw frames, so tempo changes and FPS changes stay one-line edits.
 */
export const FPS = 30;

/** Seconds → frames (rounded to the nearest frame). */
export const sec = (s: number, fps: number = FPS): number => Math.round(s * fps);

/** A musical grid. All cue points in a film snap to this. */
export type BeatGrid = { bpm: number; offset: number };

export const beatToSec = (grid: BeatGrid, beat: number): number =>
  grid.offset + (beat * 60) / grid.bpm;

/** Standard durations of the motion system, in seconds. */
export const dur = {
  snap: 0.2,
  quick: 0.35,
  base: 0.6,
  slow: 1.0,
  breath: 1.6,
  drift: 3.2,
} as const;

/** Standard stagger between sibling elements (letters, words, pieces). */
export const stagger = {
  letter: 0.028,
  word: 0.09,
  piece: 0.12,
} as const;

/** Transition lengths used by the film builder. */
export const transitionDur = {
  cut: 0,
  whip: 0.4,
  wipe: 0.6,
  dissolve: 0.9,
  through: 0.75,
} as const;
