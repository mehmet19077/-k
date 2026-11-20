import { Easing } from 'remotion';

/**
 * The NON STOP motion character, expressed as curves.
 *
 * Rule of the house: things arrive fast and settle long (mass + friction),
 * leave by accelerating (they are pulled, not faded). No bounce for type;
 * overshoot only on physical objects (paper, logo).
 */
export const ease = {
  /** Default arrival: quick attack, very long settle. */
  arrive: Easing.bezier(0.16, 1, 0.3, 1),
  /** Departure: gathers speed, exits at full velocity. */
  depart: Easing.bezier(0.7, 0, 0.84, 0),
  /** Camera: slow start, slow stop, no visible acceleration edge. */
  camera: Easing.bezier(0.45, 0, 0.15, 1),
  /** Impact: almost instant arrival, used with a short hold. */
  impact: Easing.bezier(0.05, 0.9, 0.1, 1),
  /** Symmetric, for loops and breathing. */
  sine: Easing.inOut(Easing.sin),
  /** Mask & wipe edges. */
  wipe: Easing.bezier(0.76, 0, 0.24, 1),
  linear: Easing.linear,
} as const;

export type EaseName = keyof typeof ease;
