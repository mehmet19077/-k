import React from 'react';
import { useScene } from '../scene/useScene';
import { useCanvas } from './useCanvas';

/**
 * Training-hall floor of puzzle mats in true perspective: blue field,
 * red border band, tile seams, a pool of overhead light and fog into the
 * dark. The camera dollies along Z (metres), like LaneRopes on water.
 */
export const MatFloor: React.FC<{
  z: number;
  horizon?: number;
  /** 0..1 light level. */
  light?: number;
  camHeight?: number;
  camX?: number;
}> = ({ z, horizon = 0.42, light = 1, camHeight = 1.5, camX = 0 }) => {
  const { width, height } = useScene();
  const ref = useCanvas(
    width,
    height,
    (ctx, w, h) => {
      if (light <= 0.001) return;
      const f = w * 0.85;
      const hy = h * horizon;
      const cx = w / 2;
      const near = 0.35;
      const far = 60;
      const P = (X: number, dz: number): [number, number] => [cx + ((X - camX) * f) / dz, hy + (camHeight * f) / dz];

      const quad = (x0: number, x1: number, d0: number, d1: number, fill: string) => {
        const a = P(x0, d0);
        const b = P(x1, d0);
        const c = P(x1, d1);
        const d = P(x0, d1);
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.lineTo(c[0], c[1]);
        ctx.lineTo(d[0], d[1]);
        ctx.closePath();
        ctx.fill();
      };

      // Base field (blue) and border bands (red); wood beyond.
      quad(-40, 40, near, far, '#6b4a2e');
      quad(-4.2, 4.2, near, far, '#b8323a');
      quad(-3.2, 3.2, near, far, '#2f6fd6');

      // Tile seams: constant-X lines and constant-Z rows.
      ctx.strokeStyle = 'rgba(4,8,20,0.7)';
      ctx.lineWidth = Math.max(1, w / 900);
      for (let X = -4; X <= 4; X += 1) {
        const a = P(X, near);
        const b = P(X, far);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
      for (let i = Math.ceil(z + near); i < z + far; i++) {
        const dz = i - z;
        const l = P(-4.2, dz);
        const r = P(4.2, dz);
        ctx.globalAlpha = Math.min(1, 2.5 / dz);
        ctx.beginPath();
        ctx.moveTo(l[0], l[1]);
        ctx.lineTo(r[0], r[1]);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Grade: fog to black at the horizon, a cold pool of light near camera.
      const fog = ctx.createLinearGradient(0, hy, 0, h);
      fog.addColorStop(0, 'rgba(4,6,11,1)');
      fog.addColorStop(0.3, 'rgba(4,6,11,0.5)');
      fog.addColorStop(1, 'rgba(4,6,11,0.08)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, hy, w, h - hy);
      const pool = ctx.createRadialGradient(cx, h * 0.78, 0, cx, h * 0.78, w * 0.9);
      pool.addColorStop(0, 'rgba(0,0,0,0)');
      pool.addColorStop(1, 'rgba(4,6,11,0.5)');
      ctx.fillStyle = pool;
      ctx.fillRect(0, hy, w, h - hy);
      if (light < 1) {
        ctx.fillStyle = `rgba(4,6,11,${1 - light})`;
        ctx.fillRect(0, 0, w, h);
      }
    },
    [z, horizon, light, camHeight, camX],
  );
  return <canvas ref={ref} width={width} height={height} style={{ position: 'absolute', inset: 0 }} />;
};
