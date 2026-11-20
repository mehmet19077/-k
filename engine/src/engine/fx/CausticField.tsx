import React from 'react';
import { noise3D } from '@remotion/noise';
import { useScene } from '../scene/useScene';
import { useCanvas } from './useCanvas';

/**
 * Underwater caustics from ridged 3D noise, computed on a low-res buffer
 * and scaled up (the softness is the look). `travel` scrolls the field
 * toward camera to sell forward motion.
 */
export const CausticField: React.FC<{
  intensity: number;
  travel?: number;
  scale?: number;
  seed?: string;
}> = ({ intensity, travel = 0, scale = 1, seed = 'caustic' }) => {
  const { t, width, height } = useScene();
  const bw = Math.round(width / 8);
  const bh = Math.round(height / 8);
  const ref = useCanvas(
    bw,
    bh,
    (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      const f = 0.045 / scale;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const yy = y - travel * 6;
          const n1 = noise3D(seed, x * f, yy * f, t * 0.35);
          const n2 = noise3D(seed + '2', x * f * 1.7 + 3.1, yy * f * 1.7, t * 0.5);
          const v = Math.pow(1 - Math.abs(n1), 9) + 0.7 * Math.pow(1 - Math.abs(n2), 12);
          const k = Math.min(1, v) * intensity;
          const i = (y * w + x) * 4;
          img.data[i] = 8 + 150 * k;
          img.data[i + 1] = 30 + 200 * k;
          img.data[i + 2] = 70 + 185 * k;
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    [t, intensity, travel, scale, seed],
  );
  return (
    <canvas
      ref={ref}
      width={bw}
      height={bh}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: 'blur(2px)' }}
    />
  );
};
