import { interpolate } from 'remotion';
import { noise2D } from '@remotion/noise';
import { ease, type EaseName } from '../motion/easing';

/**
 * Virtual camera. A shot is a list of keys in seconds; between keys the
 * camera always uses the camera curve unless a key says otherwise, so
 * moves start and stop without a visible acceleration edge.
 */
export type CameraKey = {
  t: number;
  /** Pan in layout units. */
  x?: number;
  y?: number;
  zoom?: number;
  /** Roll in degrees. */
  roll?: number;
  ease?: EaseName;
};

export type CameraState = { x: number; y: number; zoom: number; roll: number };

const field = (keys: CameraKey[], t: number, k: keyof CameraState, fallback: number): number => {
  const pts = keys.filter((key) => key[k] !== undefined);
  if (pts.length === 0) return fallback;
  if (t <= pts[0].t) return pts[0][k] as number;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (t <= b.t) {
      return interpolate(t, [a.t, b.t], [a[k] as number, b[k] as number], {
        easing: ease[b.ease ?? 'camera'],
      });
    }
  }
  return pts[pts.length - 1][k] as number;
};

export const cameraAt = (keys: CameraKey[], t: number): CameraState => ({
  x: field(keys, t, 'x', 0),
  y: field(keys, t, 'y', 0),
  zoom: field(keys, t, 'zoom', 1),
  roll: field(keys, t, 'roll', 0),
});

/**
 * Handheld / impact shake. `amount` in layout units. Smooth noise, never
 * per-frame random jitter, so it reads as a body holding the camera.
 */
export const shake = (seed: string, t: number, amount: number, speed = 1.4): CameraState => ({
  x: noise2D(seed + 'x', t * speed, 0) * amount,
  y: noise2D(seed + 'y', 0, t * speed) * amount,
  zoom: 1,
  roll: noise2D(seed + 'r', t * speed * 0.7, 3) * amount * 0.02,
});

/** Decaying impact shake: strong at `at`, gone after `decay` seconds. */
export const impactShake = (seed: string, t: number, at: number, amount: number, decay = 0.6) => {
  if (t < at) return { x: 0, y: 0, zoom: 1, roll: 0 };
  const k = Math.exp(-((t - at) / decay) * 4);
  const s = shake(seed, t, amount * k, 18);
  return s;
};

export const addCamera = (a: CameraState, b: CameraState): CameraState => ({
  x: a.x + b.x,
  y: a.y + b.y,
  zoom: a.zoom * b.zoom,
  roll: a.roll + b.roll,
});
