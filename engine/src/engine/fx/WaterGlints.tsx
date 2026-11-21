import React from 'react';
import { noise3D } from '@remotion/noise';
import { random } from 'remotion';
import { useScene } from '../scene/useScene';
import { color } from '../tokens';
import { useCanvas } from './useCanvas';

/**
 * Light on dark water: a path of glints that twinkle with the swell.
 * Rows bunch toward the horizon to give perspective; every glint's
 * brightness comes from 3D noise in (x, y, time), so it is deterministic.
 */
export const WaterGlints: React.FC<{
  /** 0..1 overall brightness (animate from the scene). */
  intensity: number;
  /** Horizon height as a fraction of frame height. */
  horizon?: number;
  /** Centre of the light path as a fraction of frame width. */
  center?: number;
  /** Width of the light path (fraction of frame width, at the bottom). */
  spread?: number;
  /** Time multiplier for the swell. */
  speed?: number;
  tint?: string;
  seed?: string;
}> = ({ intensity, horizon = 0.42, center = 0.5, spread = 0.7, speed = 1, tint = color.caustic, seed = 'water' }) => {
  const { t, width, height, unit } = useScene();
  const ref = useCanvas(
    width,
    height,
    (ctx, w, h) => {
      if (intensity <= 0.001) return;
      const hy = h * horizon;
      const cx = w * center;
      const time = t * speed;

      // Horizon haze.
      const haze = ctx.createRadialGradient(cx, hy, 0, cx, hy, w * 0.75);
      haze.addColorStop(0, `rgba(159,212,255,${0.16 * intensity})`);
      haze.addColorStop(1, 'rgba(159,212,255,0)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'lighter';
      const rows = 120;
      for (let r = 0; r < rows; r++) {
        const d = (r + 0.5) / rows;
        const y = hy + (h - hy) * Math.pow(d, 1.9);
        const pathW = w * (0.04 + spread * 0.5 * d);
        const count = 6 + Math.floor(34 * d);
        const len = (5 + 70 * d) * unit;
        const thick = (0.8 + 4.2 * d) * unit;
        for (let i = 0; i < count; i++) {
          // Per-glint jitter breaks the column grid so the water never reads as a barcode.
          const u = (i + 0.5 + (random(`${seed}-${r}-${i}`) - 0.5) * 1.6) / count - 0.5;
          const lenK = 0.45 + random(`${seed}-l-${r}-${i}`) * 1.1;
          const sway = noise3D(seed, r * 0.21, i * 0.37, time * 0.35) * pathW * 0.18;
          const x = cx + u * pathW * 2 + sway;
          const across = Math.exp(-Math.pow(u * 2.2, 2));
          const sparkle = noise3D(seed + 's', x * 0.004 / unit, r * 0.45, time * 1.1);
          const b = Math.max(0, sparkle - 0.15) * 1.6 * across * intensity * (0.35 + 0.65 * d);
          if (b < 0.02) continue;
          const a = Math.min(1, b);
          ctx.fillStyle = b > 0.75 ? `rgba(230,246,255,${a})` : hexA(tint, a * 0.85);
          ctx.beginPath();
          ctx.ellipse(x, y, len * lenK * (0.4 + b), thick, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    },
    [t, intensity, horizon, center, spread, speed, tint, seed, unit],
  );
  return <canvas ref={ref} width={width} height={height} style={{ position: 'absolute', inset: 0 }} />;
};

export const hexA = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
