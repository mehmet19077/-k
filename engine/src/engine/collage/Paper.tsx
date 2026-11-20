import React from 'react';
import { interpolate } from 'remotion';
import { ease } from '../motion/easing';
import { rand } from '../motion/random';
import { useScene } from '../scene/useScene';
import { color as palette } from '../tokens';

/** A torn-edge polygon (percent coordinates), seeded so it never changes between frames. */
export const tornPath = (seed: string, roughness = 1.6, teeth = 14): string => {
  const pts: string[] = [];
  const edge = (from: [number, number], to: [number, number], key: string, nx: number, ny: number) => {
    for (let i = 0; i < teeth; i++) {
      const k = i / teeth;
      const j = rand(`${seed}-${key}-${i}`, -roughness, roughness);
      pts.push(`${(from[0] + (to[0] - from[0]) * k + nx * j).toFixed(2)}% ${(from[1] + (to[1] - from[1]) * k + ny * j).toFixed(2)}%`);
    }
  };
  edge([0, 0], [100, 0], 't', 0, 1);
  edge([100, 0], [100, 100], 'r', -1, 0);
  edge([100, 100], [0, 100], 'b', 0, -1);
  edge([0, 100], [0, 0], 'l', 1, 0);
  return `polygon(${pts.join(',')})`;
};

/**
 * A piece of paper in the collage. It slides in from `from` and lands
 * with a small overshoot in rotation; position updates on 2-frame steps
 * (stop-motion). Placement is centre-based in layout units.
 */
export const Paper: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  fill?: string;
  halftone?: boolean;
  at: number;
  /** Optional exit: the piece is pulled off in the direction it came from. */
  outAt?: number;
  from?: 'left' | 'right' | 'top' | 'bottom';
  seed: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ x, y, w, h, rotate = 0, fill = palette.bone, halftone = false, at, outAt, from = 'bottom', seed, children, style }) => {
  const { frame, fps, unit } = useScene();
  const t = Math.floor(frame / 2) * 2 / fps;
  const p = interpolate(t, [at, at + 0.55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.arrive,
  });
  const out =
    outAt === undefined
      ? 0
      : interpolate(t, [outAt, outAt + 0.4], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: ease.depart,
        });
  if (p <= 0 || out >= 1) return null;
  const dist = 1300;
  const dx = from === 'left' ? -dist : from === 'right' ? dist : 0;
  const dy = from === 'top' ? -dist : from === 'bottom' ? dist : 0;
  const settle = Math.sin(p * Math.PI) * rand(`${seed}-rot`, -9, 9);
  return (
    <div
      style={{
        position: 'absolute',
        left: (x - w / 2) * unit,
        top: (y - h / 2) * unit,
        width: w * unit,
        height: h * unit,
        transform: `translate3d(${dx * (1 - p + out) * unit}px, ${dy * (1 - p + out) * unit}px, 0) rotate(${rotate + settle + out * 12}deg)`,
        filter: `drop-shadow(0 ${14 * unit}px ${22 * unit}px rgba(0,0,0,0.55))`,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: fill,
          clipPath: tornPath(seed),
          overflow: 'hidden',
        }}
      >
        {halftone ? <Halftone /> : null}
        {children}
      </div>
    </div>
  );
};

/** Printed halftone dot field, fading across the piece. */
export const Halftone: React.FC<{ dot?: number; ink?: string }> = ({ dot = 9, ink = 'rgba(7,11,20,0.85)' }) => {
  const { unit } = useScene();
  const s = dot * unit;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(circle, ${ink} 32%, transparent 34%)`,
        backgroundSize: `${s}px ${s}px`,
        WebkitMaskImage: 'linear-gradient(120deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0) 100%)',
        maskImage: 'linear-gradient(120deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0) 100%)',
      }}
    />
  );
};
