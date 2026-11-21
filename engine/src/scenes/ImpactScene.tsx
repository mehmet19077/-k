import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { z } from 'zod';
import { addCamera, cameraAt, impactShake } from '../engine/camera/camera';
import { DepthLayer, Stage } from '../engine/camera/Stage';
import { Flash } from '../engine/fx/Flash';
import { Particles } from '../engine/fx/Particles';
import { WaterGlints } from '../engine/fx/WaterGlints';
import { ease } from '../engine/motion/easing';
import { sceneBase } from '../engine/scene/schema';
import { useLayout } from '../engine/scene/layout';
import { Text } from '../engine/type/Text';
import { color, depth } from '../engine/tokens';

export const impactSchema = z.object({
  ...sceneBase,
  type: z.literal('impact'),
  word: z.string(),
  kicker: z.string(),
  /** Scene second of the hit (sync point for the impact sound). */
  hit: z.number().default(0),
});

/**
 * IMPACT — one word, one hit. Flash, decaying camera shake, chromatic
 * split that resolves in a third of a second, a spray of water, then a
 * controlled hold with a light sweep. Fast, never chaotic.
 */
export const ImpactScene: React.FC<z.infer<typeof impactSchema>> = ({ word, kicker, hit, accent }) => {
  const L = useLayout();
  const { t, duration, unit, w } = L;
  const accentColor = color[accent ?? 'signal'];
  const cam = addCamera(
    cameraAt([{ t: hit, zoom: 1.0 }, { t: duration, zoom: 1.1, ease: 'sine' }], t),
    impactShake('impact', t, hit, 34, 0.7),
  );
  const chroma = t < hit ? 0 : 9 * Math.exp(-(t - hit) * 7);
  const bar = interpolate(t, [hit + 0.22, hit + 0.75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.wipe });
  const glow = interpolate(t, [hit, hit + 0.15, hit + 1.6], [0, 1, 0.45], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const size = Math.min(176, ((w - L.margin * 2) / (word.length * 0.64)));
  return (
    <AbsoluteFill style={{ background: color.void }}>
      <Stage cam={cam}>
        <DepthLayer z={depth.back}>
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse 70% 40% at 50% 50%, rgba(47,111,214,${0.42 * glow}) 0%, rgba(4,6,11,0) 70%)`,
            }}
          />
          <WaterGlints intensity={0.35 + 0.4 * glow} horizon={0.68} spread={0.9} speed={1.6} seed="impact" />
        </DepthLayer>
        <DepthLayer z={depth.subject}>
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Text text={word} size={size} move="Impact" at={hit} align="center" tracking="tight" chroma={chroma} sweep={{ at: hit + 1.15, duration: 1.0 }} upper />
            <div
              style={{
                width: (w - L.margin * 2) * 0.62 * unit,
                height: 12 * unit,
                marginTop: 26 * unit,
                background: accentColor,
                transform: `scaleX(${bar})`,
                transformOrigin: '0% 50%',
                boxShadow: `0 0 ${24 * unit}px rgba(214,50,40,${0.55 * bar})`,
              }}
            />
            <div style={{ height: 48 * unit }} />
            <Text text={kicker} size="kicker" weight={700} tracking="whisper" color={color.ice} move="Rise" at={hit + 1.3} align="center" upper />
          </AbsoluteFill>
        </DepthLayer>
        <DepthLayer z={depth.front}>
          <Particles mode="burst" at={hit + 0.02} count={90} seed="spray" size={4} origin={[0.5, 0.5]} />
        </DepthLayer>
      </Stage>
      <Flash at={hit} strength={0.85} decay={0.3} />
    </AbsoluteFill>
  );
};
