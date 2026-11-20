import type { CSSProperties } from 'react';
import { interpolate } from 'remotion';
import { dur } from '../timing';
import { ease, type EaseName } from './easing';

/**
 * NON STOP motion vocabulary.
 *
 * Every move is data: a start pose, an end pose, a duration, a curve, a
 * direction and a stated purpose. Components never invent ad-hoc
 * keyframes; they ask for a move by name so the whole engine shares one
 * movement character.
 */

export type Pose = {
  opacity: number;
  /** Offsets in layout units (1 = 1px on a 1080-wide frame). */
  x: number;
  y: number;
  scale: number;
  rotate: number;
  /** Gaussian blur in layout units. */
  blur: number;
  /** Vertical mask: 0 = fully hidden below the line, 1 = fully shown. */
  reveal: number;
  /** Tracking (letter-spacing) in em, added to the text's base tracking. */
  tracking: number;
};

export const REST: Pose = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
  blur: 0,
  reveal: 1,
  tracking: 0,
};

export type Direction = 'up' | 'down' | 'left' | 'right' | 'in' | 'out' | 'none';

export type MoveSpec = {
  from: Partial<Pose>;
  to: Partial<Pose>;
  /** Seconds. */
  duration: number;
  ease: EaseName;
  direction: Direction;
  purpose: string;
};

export const NS = {
  /** Default text entrance. Rises a short distance out of soft focus. */
  Rise: {
    from: { opacity: 0, y: 46, blur: 10 },
    to: {},
    duration: dur.base,
    ease: 'arrive',
    direction: 'up',
    purpose: 'Body copy, kickers, secondary lines. Calm and legible.',
  },
  /** Masked line reveal: type slides up from behind its own baseline. */
  Reveal: {
    from: { reveal: 0, y: 70 },
    to: {},
    duration: dur.slow,
    ease: 'arrive',
    direction: 'up',
    purpose: 'Headlines. The line is cut from the dark, never faded in.',
  },
  /** Rack focus: out-of-focus and slightly large, settles sharp. */
  Focus: {
    from: { opacity: 0, blur: 34, scale: 1.08 },
    to: {},
    duration: dur.breath,
    ease: 'arrive',
    direction: 'in',
    purpose: 'Statements that must feel considered. Resolution beats.',
  },
  /** Physical hit: arrives almost instantly from scale, with blur trail. */
  Impact: {
    from: { opacity: 0, scale: 1.75, blur: 26 },
    to: {},
    duration: dur.quick,
    ease: 'impact',
    direction: 'in',
    purpose: 'One word per film. Always on a sound hit.',
  },
  /** Lateral carry: continues the camera's direction of travel. */
  Flow: {
    from: { opacity: 0, x: 120, blur: 14 },
    to: {},
    duration: dur.base,
    ease: 'arrive',
    direction: 'left',
    purpose: 'Words that ride a camera move or a whip transition.',
  },
  /** Tracking collapse: letters gather from wide spacing. */
  Gather: {
    from: { opacity: 0, tracking: 0.6, blur: 8 },
    to: {},
    duration: dur.breath,
    ease: 'arrive',
    direction: 'in',
    purpose: 'Wordmarks, brand names, end cards.',
  },
  /** Standard exit: pulled upward and away. Exits are faster than entrances. */
  Exit: {
    from: {},
    to: { opacity: 0, y: -40, blur: 12 },
    duration: dur.quick,
    ease: 'depart',
    direction: 'up',
    purpose: 'Leaving a beat. Never a plain fade.',
  },
  /** Dissolve into light / dark, for endings. */
  Fade: {
    from: {},
    to: { opacity: 0, blur: 6 },
    duration: dur.slow,
    ease: 'sine',
    direction: 'none',
    purpose: 'Final frames and quiet scene ends only.',
  },
} satisfies Record<string, MoveSpec>;

export type MoveName = keyof typeof NS;

const KEYS: (keyof Pose)[] = ['opacity', 'x', 'y', 'scale', 'rotate', 'blur', 'reveal', 'tracking'];

/** Progress 0..1 of a move started at `start` seconds, at time `t` seconds. */
export const moveProgress = (move: MoveSpec, t: number, start: number, speed = 1): number =>
  interpolate(t, [start, start + move.duration / speed], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease[move.ease],
  });

/** Pose of a move at time t. */
export const poseAt = (move: MoveSpec, t: number, start: number, speed = 1): Pose => {
  const p = moveProgress(move, t, start, speed);
  const from = { ...REST, ...move.from };
  const to = { ...REST, ...move.to };
  const out = { ...REST };
  for (const k of KEYS) out[k] = from[k] + (to[k] - from[k]) * p;
  return out;
};

/** Layer an entrance and an optional exit: offsets add, scales and opacities multiply. */
export const combine = (a: Pose, b: Pose): Pose => ({
  opacity: a.opacity * b.opacity,
  x: a.x + b.x,
  y: a.y + b.y,
  scale: a.scale * b.scale,
  rotate: a.rotate + b.rotate,
  blur: a.blur + b.blur,
  reveal: Math.min(a.reveal, b.reveal),
  tracking: a.tracking + b.tracking,
});

/** Entrance at `inAt`, optional exit at `outAt`, both in seconds. */
export const animate = (
  t: number,
  enter: MoveName,
  inAt: number,
  exit?: { move?: MoveName; at: number },
  speed = 1,
): Pose => {
  const a = poseAt(NS[enter], t, inAt, speed);
  if (!exit) return a;
  return combine(a, poseAt(NS[exit.move ?? 'Exit'], t, exit.at, speed));
};

/** Pose → CSS. `unit` converts layout units to pixels for the current format. */
export const poseStyle = (p: Pose, unit: number): CSSProperties => ({
  opacity: p.opacity,
  transform: `translate3d(${p.x * unit}px, ${p.y * unit}px, 0) scale(${p.scale}) rotate(${p.rotate}deg)`,
  filter: p.blur > 0.05 ? `blur(${p.blur * unit}px)` : undefined,
});
