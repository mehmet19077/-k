import React from 'react';
import { useScene } from '../scene/useScene';
import { color } from '../tokens';
import { useCanvas } from './useCanvas';
import { hexA } from './WaterGlints';

/**
 * Pool lane ropes in true perspective. The camera travels forward along
 * Z; floats are projected per frame, so this is real camera tracking,
 * not a scaled image. Float colours follow the brand (signal red, pulse
 * blue, ice white).
 */
export const LaneRopes: React.FC<{
  /** Metres travelled. */
  z: number;
  horizon?: number;
  opacity?: number;
  lanes?: number[];
  camHeight?: number;
}> = ({ z, horizon = 0.36, opacity = 1, lanes = [-6.25, -3.75, -1.25, 1.25, 3.75, 6.25], camHeight = 0.9 }) => {
  const { width, height } = useScene();
  const ref = useCanvas(
    width,
    height,
    (ctx, w, h) => {
      const f = w * 0.9;
      const hy = h * horizon;
      const cx = w / 2;
      const step = 0.42;
      const first = Math.ceil((z + 0.6) / step);
      const last = Math.floor((z + 70) / step);
      for (let i = last; i >= first; i--) {
        const dz = i * step - z;
        const fog = Math.exp(-dz / 22) * opacity;
        const r = (0.075 * f) / dz;
        const sy = hy + (camHeight * f) / dz;
        const band = Math.floor(i / 6) % 3;
        const c = band === 0 ? color.signal : band === 1 ? color.ice : color.pulse;
        for (const X of lanes) {
          const sx = cx + (X * f) / dz;
          if (sx < -r * 2 || sx > w + r * 2) continue;
          ctx.fillStyle = hexA(c, fog * 0.92);
          ctx.beginPath();
          ctx.ellipse(sx, sy, r * 1.25, r * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
          // Specular highlight from the ceiling light.
          ctx.fillStyle = `rgba(255,255,255,${fog * 0.5})`;
          ctx.beginPath();
          ctx.ellipse(sx - r * 0.3, sy - r * 0.25, r * 0.45, r * 0.2, 0, 0, Math.PI * 2);
          ctx.fill();
          // Reflection streak on the water.
          ctx.fillStyle = hexA(c, fog * 0.12);
          ctx.fillRect(sx - r * 0.5, sy + r * 0.7, r, r * 3.2);
        }
      }
    },
    [z, horizon, opacity, camHeight, lanes.join(',')],
  );
  return <canvas ref={ref} width={width} height={height} style={{ position: 'absolute', inset: 0 }} />;
};
