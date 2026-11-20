import { z } from 'zod';
import { sceneSchema } from '../scenes';

export const storyModes = [
  'cinematic',
  'documentary',
  'editorial',
  'emotional',
  'minimal',
  'energetic',
  'educational',
  'sports',
  'brand',
] as const;

export const filmSchema = z.object({
  title: z.string(),
  /** Story mode — drives pacing and transition choice in the story composer. */
  mode: z.enum(storyModes),
  style: z.string(),
  music: z
    .object({
      src: z.string(),
      volume: z.number().min(0).max(1.5).default(0.9),
      fadeIn: z.number().default(0.5),
      fadeOut: z.number().default(1.2),
    })
    .optional(),
  finish: z
    .object({
      grain: z.number().min(0).max(0.4).default(0.085),
      vignette: z.number().min(0).max(1).default(0.62),
    })
    .default({ grain: 0.085, vignette: 0.62 }),
  scenes: z.array(sceneSchema).min(1),
});

export type FilmSpec = z.infer<typeof filmSchema>;
