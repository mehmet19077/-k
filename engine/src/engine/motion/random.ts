import { random } from 'remotion';

/** Deterministic random helpers: same seed, same frame, same result. */
export const rand = (seed: string | number, min = 0, max = 1): number =>
  min + random(seed) * (max - min);

