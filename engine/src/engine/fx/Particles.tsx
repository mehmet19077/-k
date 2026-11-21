import React from 'react';
import { noise2D } from '@remotion/noise';
import { random } from 'remotion';
import { useScene } from '../scene/useScene';
import { useCanvas } from './useCanvas';

/**
 * Deterministic particle systems.
 * - `drift`: suspended particles / bubbles rising through the frame.
 * - `burst`: a spray of droplets thrown out from a point at `at` seconds.
 */
export const Particles: React.FC<{
  mode: 'drift' | 'burst';
  count?: number;
  seed?: string;
  opacity?: number;
  /** Burst origin as a fraction of the frame. */
  origin?: [number, number];
  at?: number;
  /** Particle size in layout units. */
  size?: number;
  rgb?: string;
}> = ({ mode, count = 60, seed = 'p', opacity = 1, origin = [0.5, 0.5], at = 0, size = 3, rgb = '230,246,255' }) => {
  const { t, width, height, unit } = useScene();
  const ref = useCanvas(
    width,
    height,
    (ctx, w, h) => {
      if (opacity <= 0) return;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < count; i++) {
        const r0 = random(`${seed}-${i}-a`);
        const r1 = random(`${seed}-${i}-b`);
        const r2 = random(`${seed}-${i}-c`);
        let x: number;
        let y: number;
        let a: number;
        const s = size * unit * (0.35 + r2 * 1.3);
        if (mode === 'drift') {
          const speed = (14 + r1 * 40) * unit;
          y = ((r1 * h - t * speed) % h + h) % h;
          x = r0 * w + noise2D(seed, i, t * 0.25) * 40 * unit;
          a = (0.25 + r2 * 0.6) * opacity;
        } else {
          const dt = t - at;
          if (dt < 0) continue;
          const ang = r0 * Math.PI * 2;
          const v = (500 + r1 * 1700) * unit;
          const drag = (1 - Math.exp(-dt * 3.2)) / 3.2;
          x = origin[0] * w + Math.cos(ang) * v * drag;
          y = origin[1] * h + Math.sin(ang) * v * drag + 420 * unit * dt * dt;
          a = Math.max(0, 1 - dt / (0.6 + r2 * 0.9)) * opacity;
        }
        if (a <= 0.01) continue;
        const g = ctx.createRadialGradient(x, y, 0, x, y, s * 2.4);
        g.addColorStop(0, `rgba(${rgb},${a})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - s * 2.4, y - s * 2.4, s * 4.8, s * 4.8);
      }
      ctx.globalCompositeOperation = 'source-over';
    },
    [t, mode, count, seed, opacity, at, size, rgb, origin[0], origin[1], unit],
  );
  return <canvas ref={ref} width={width} height={height} style={{ position: 'absolute', inset: 0 }} />;
};
