import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile } from 'remotion';
import { z } from 'zod';
import { animate, poseStyle } from '../engine/motion/motion';
import { ease } from '../engine/motion/easing';
import { sceneBase } from '../engine/scene/schema';
import { useLayout } from '../engine/scene/layout';
import { Text } from '../engine/type/Text';
import { color } from '../engine/tokens';

export const outroSchema = z.object({
  ...sceneBase,
  type: z.literal('outro'),
  logo: z.string(),
  /** Logo diameter in layout units. */
  logoSize: z.number().default(520),
  wordmark: z.string(),
  tagline: z.string(),
  /** Seconds of fade to black at the end. */
  fadeOut: z.number().default(0.9),
});

/**
 * OUTRO — the brand lock-up. The logo racks into focus, a ring of light
 * draws around it, a sweep passes over it once, the wordmark gathers
 * from wide tracking and the frame closes to black.
 */
export const OutroScene: React.FC<z.infer<typeof outroSchema>> = ({ logo, logoSize, wordmark, tagline, fadeOut }) => {
  const L = useLayout();
  const { t, duration, unit, portrait } = L;
  const size = Math.min(logoSize, L.h * 0.5);
  const logoPose = animate(t, 'Focus', 0.25);
  const ring = interpolate(t, [0.55, 1.9], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.arrive });
  const sweep = interpolate(t, [1.7, 2.7], [-60, 160], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.wipe });
  const glow = interpolate(t, [0.2, 1.8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.arrive });
  const black = interpolate(t, [duration - fadeOut, duration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.sine });
  const drift = 1 + 0.03 * (t / duration);
  const r = size / 2 + 26;
  const circ = 2 * Math.PI * r;
  return (
    <AbsoluteFill style={{ background: color.void }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% ${portrait ? 42 : 40}%, rgba(47,111,214,${0.3 * glow}) 0%, rgba(4,6,11,0) ${portrait ? 45 : 38}%)`,
        }}
      />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', transform: `scale(${drift})` }}>
        <div style={{ position: 'relative', width: size * unit, height: size * unit, ...poseStyle(logoPose, unit) }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', boxShadow: `0 ${30 * unit}px ${80 * unit}px rgba(0,0,0,0.6)` }}>
            <Img src={staticFile(logo)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(110deg, rgba(255,255,255,0) ${sweep - 18}%, rgba(255,255,255,0.55) ${sweep}%, rgba(255,255,255,0) ${sweep + 18}%)`,
                mixBlendMode: 'screen',
              }}
            />
          </div>
          <svg
            width={(size + 80) * unit}
            height={(size + 80) * unit}
            viewBox={`${-size / 2 - 40} ${-size / 2 - 40} ${size + 80} ${size + 80}`}
            style={{ position: 'absolute', left: -40 * unit, top: -40 * unit, overflow: 'visible' }}
          >
            <circle
              r={r}
              fill="none"
              stroke={color.caustic}
              strokeWidth={1.6}
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - ring)}
              transform="rotate(-90)"
              opacity={0.85}
              style={{ filter: `drop-shadow(0 0 6px ${color.caustic})` }}
            />
          </svg>
        </div>
        <div style={{ height: 90 * unit }} />
        <Text text={wordmark} size={30} weight={700} tracking="whisper" move="Gather" at={1.15} align="center" upper />
        <div style={{ height: 26 * unit }} />
        <Text text={tagline} size="lead" weight={600} tracking="normal" color={color.mist} move="Rise" at={2.0} align="center" />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#000', opacity: black }} />
    </AbsoluteFill>
  );
};
