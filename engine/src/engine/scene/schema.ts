import { z } from 'zod';
import { color } from '../tokens';

/** Shared parts of every scene spec. Scene-specific props live with each scene. */
export const colorToken = z.enum(Object.keys(color) as [keyof typeof color, ...(keyof typeof color)[]]);

export const transitionSchema = z.object({
  type: z.enum(['cut', 'whip', 'flash', 'push', 'dissolve', 'wipe']),
  duration: z.number().min(0).max(3),
  direction: z.enum(['left', 'right', 'up', 'down']).optional(),
});
export type TransitionSpec = z.infer<typeof transitionSchema>;

export const soundCueSchema = z.object({
  src: z.string(),
  /** Seconds from the start of the scene (may be negative to lead in). */
  at: z.number(),
  volume: z.number().min(0).max(2).default(1),
  /** Voice-over: seconds during which the music is ducked under this cue. */
  duck: z.number().min(0).optional(),
});
export type SoundCue = z.infer<typeof soundCueSchema>;

export const sceneBase = {
  id: z.string(),
  /** Seconds, including the incoming transition overlap. */
  duration: z.number().min(0.5).max(60),
  /** Transition INTO this scene from the previous one. */
  transition: transitionSchema.optional(),
  accent: colorToken.optional(),
  sound: z.array(soundCueSchema).optional(),
};
