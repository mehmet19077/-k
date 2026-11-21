import React from 'react';
import { interpolate } from 'remotion';
import { ease } from '../motion/easing';
import { useScene } from '../scene/useScene';
import { color as palette } from '../tokens';

/** Stopwatch dial: ticks draw on, the hand steps once per second like a pace clock. */
export const Dial: React.FC<{ size: number; at: number; ink?: string; hand?: string }> = ({
  size,
  at,
  ink = palette.ink,
  hand = palette.signal,
}) => {
  const { t, unit } = useScene();
  const draw = interpolate(t, [at, at + 0.9], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.arrive,
  });
  const local = Math.max(0, t - at);
  const whole = Math.floor(local * 2);
  const frac = local * 2 - whole;
  const step = whole + ease.impact(Math.min(1, frac * 4));
  const angle = step * 30;
  const ticks = 60;
  const r = 46;
  return (
    <svg width={size * unit} height={size * unit} viewBox="-50 -50 100 100" style={{ overflow: 'visible' }}>
      {Array.from({ length: ticks }, (_, i) => {
        if (i / ticks > draw) return null;
        const a = (i / ticks) * Math.PI * 2;
        const long = i % 5 === 0;
        const r0 = long ? r - 9 : r - 4;
        return (
          <line
            key={i}
            x1={Math.sin(a) * r0}
            y1={-Math.cos(a) * r0}
            x2={Math.sin(a) * r}
            y2={-Math.cos(a) * r}
            stroke={ink}
            strokeWidth={long ? 1.6 : 0.7}
          />
        );
      })}
      <g style={{ transform: `rotate(${angle}deg)`, opacity: draw }}>
        <line x1={0} y1={8} x2={0} y2={-38} stroke={hand} strokeWidth={1.8} strokeLinecap="round" />
      </g>
      <circle r={2.4} fill={hand} opacity={draw} />
    </svg>
  );
};
