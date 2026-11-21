import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { useScene } from '../scene/useScene';

/** A light flash peaking at `at` seconds: fast attack, exponential decay. */
export const Flash: React.FC<{ at: number; strength?: number; decay?: number; tint?: string }> = ({
  at,
  strength = 1,
  decay = 0.35,
  tint = '230,246,255',
}) => {
  const { t } = useScene();
  const attack = interpolate(t, [at - 0.05, at], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const a = t <= at ? attack : Math.exp(-(t - at) / decay * 3);
  if (a * strength < 0.005) return null;
  return <AbsoluteFill style={{ background: `rgba(${tint},${a * strength})`, mixBlendMode: 'screen' }} />;
};
