/**
 * NON STOP design tokens — the single source of truth for colour, type,
 * depth and texture. Scenes never hard-code a colour or a font size:
 * they pick a token so every film speaks the same visual language.
 */

export const color = {
  /** Deepest ground. Not pure black: a cold ink that holds grain. */
  void: '#04060b',
  ink: '#070b14',
  deep: '#0b1a3d', // brand navy
  steel: '#1a2740',
  mist: '#8a97ad',
  ice: '#eef3fa', // primary type colour on dark
  bone: '#f4f2ee', // paper / collage ground
  /** Light carried by water: the only "glow" colour. */
  caustic: '#9fd4ff',
  causticHot: '#e6f6ff',
  /** Brand accents — used sparingly, one per shot. */
  signal: '#d63228', // brand red: impact, discipline
  pulse: '#2f6fd6', // brand blue: flow, water
  gold: '#f6b928',
} as const;

export type ColorToken = keyof typeof color;

export const font = {
  display: 'NS Display',
  text: 'NS Display',
} as const;

/** Type scale in px for a 1080-wide frame; scaled by `unit` per format. */
export const type = {
  micro: 22,
  kicker: 26,
  body: 40,
  lead: 56,
  title: 96,
  hero: 168,
  mega: 260,
} as const;

/** Tracking (letter-spacing, em). Wide tracking = quiet, tight = loud. */
export const tracking = {
  whisper: 0.42,
  wide: 0.24,
  normal: 0,
  tight: -0.035,
  crush: -0.055,
} as const;

/** Depth planes for parallax. 0 = background (moves least). */
export const depth = {
  far: 0.18,
  back: 0.4,
  mid: 0.7,
  /** Type plane: rides the camera, but zoom can never push it out of the safe area. */
  type: 0.35,
  subject: 1,
  front: 1.45,
} as const;

/** Global finishing layer defaults. */
export const finish = {
  grainOpacity: 0.085,
  vignette: 0.62,
  letterbox: 0, // 0..1 fraction of bar height; scenes may animate it
} as const;

export const safeArea = {
  /** Fraction of the short side kept clear of type (social UI overlays). */
  margin: 0.075,
} as const;
