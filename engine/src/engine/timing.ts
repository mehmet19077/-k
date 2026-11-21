/**
 * Central timing system. Films are written in seconds, never in raw
 * frames (scene/timeline.ts converts), so an FPS change is a one-line edit.
 */
export const FPS = 30;

/** Standard durations of the motion system, in seconds. */
export const dur = {
  quick: 0.35,
  base: 0.6,
  slow: 1.0,
  breath: 1.6,
} as const;
