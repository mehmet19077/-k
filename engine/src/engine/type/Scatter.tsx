import React from 'react';
import { interpolate } from 'remotion';
import { ease } from '../motion/easing';
import { rand } from '../motion/random';
import { useScene } from '../scene/useScene';
import { color as palette, font } from '../tokens';

/**
 * Letters that break away from a word (`mode: 'out'`) or fly in from
 * debris to form it (`mode: 'in'`). Each glyph has its own seeded
 * vector, spin and depth blur.
 */
export const Scatter: React.FC<{
  text: string;
  size: number;
  at: number;
  mode: 'in' | 'out';
  duration?: number;
  color?: string;
  weight?: number;
  tracking?: number;
  seed?: string;
}> = ({ text, size, at, mode, duration = 0.8, color = palette.ice, weight = 800, tracking = -0.04, seed = 'scatter' }) => {
  const { t, unit } = useScene();
  const glyphs = Array.from(text);
  return (
    <div
      style={{
        fontFamily: font.display,
        fontWeight: weight,
        fontSize: size * unit,
        lineHeight: 1,
        letterSpacing: `${tracking}em`,
        color,
        whiteSpace: 'pre',
      }}
    >
      {glyphs.map((g, i) => {
        const delay = rand(`${seed}-d${i}`, 0, 0.18);
        const raw = interpolate(t, [at + delay, at + delay + duration], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: mode === 'out' ? ease.depart : ease.arrive,
        });
        const away = mode === 'out' ? raw : 1 - raw;
        const ang = rand(`${seed}-a${i}`, -Math.PI, Math.PI);
        const dist = rand(`${seed}-r${i}`, 260, 900);
        const x = Math.cos(ang) * dist * away;
        const y = Math.sin(ang) * dist * away * 0.7;
        const rot = rand(`${seed}-s${i}`, -140, 140) * away;
        const scale = 1 + rand(`${seed}-z${i}`, -0.5, 0.9) * away;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              opacity: 1 - away,
              transform: `translate3d(${x * unit}px, ${y * unit}px, 0) rotate(${rot}deg) scale(${scale})`,
              filter: away > 0.02 ? `blur(${away * 14 * unit}px)` : undefined,
            }}
          >
            {g}
          </span>
        );
      })}
    </div>
  );
};
