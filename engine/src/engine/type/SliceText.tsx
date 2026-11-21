import React from 'react';
import { interpolate } from 'remotion';
import { ease } from '../motion/easing';
import { rand } from '../motion/random';
import { useScene } from '../scene/useScene';
import { color as palette, font } from '../tokens';

/**
 * Editorial slice: a word cut into horizontal strips that arrive
 * misaligned and lock into register — or come apart at `breakAt`.
 * Strip motion is quantised to 2-frame steps (stop-motion cadence).
 */
export const SliceText: React.FC<{
  text: string;
  size: number;
  at: number;
  breakAt?: number;
  slices?: number;
  amplitude?: number;
  color?: string;
  weight?: number;
  tracking?: number;
  seed?: string;
}> = ({ text, size, at, breakAt, slices = 5, amplitude = 420, color = palette.ice, weight = 800, tracking = -0.04, seed = 'slice' }) => {
  const { frame, fps, unit } = useScene();
  const t = Math.floor(frame / 2) * 2 / fps;
  const strips = Array.from({ length: slices }, (_, i) => {
    const dir = i % 2 === 0 ? -1 : 1;
    const off = dir * amplitude * rand(`${seed}-${i}`, 0.45, 1);
    const pin = interpolate(t, [at + i * 0.06, at + i * 0.06 + 0.7], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease.arrive,
    });
    const tear =
      breakAt === undefined
        ? 0
        : interpolate(t, [breakAt + i * 0.03, breakAt + i * 0.03 + 0.45], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: ease.depart,
          });
    const x = off * pin - dir * amplitude * 1.6 * tear;
    const opacity = Math.min(1, 1 - pin * 0.9) * (1 - tear);
    const top = (i / slices) * 100;
    const bottom = 100 - ((i + 1) / slices) * 100;
    return { x, opacity, top, bottom };
  });
  const common: React.CSSProperties = {
    fontFamily: font.display,
    fontWeight: weight,
    fontSize: size * unit,
    lineHeight: 1,
    letterSpacing: `${tracking}em`,
    color,
    whiteSpace: 'pre',
  };
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ ...common, visibility: 'hidden' }}>{text}</span>
      {strips.map((s, i) => (
        <span
          key={i}
          style={{
            ...common,
            position: 'absolute',
            left: 0,
            top: 0,
            opacity: s.opacity,
            clipPath: `inset(${s.top}% -20% ${s.bottom}% -20%)`,
            transform: `translateX(${s.x * unit}px)`,
          }}
        >
          {text}
        </span>
      ))}
    </div>
  );
};
