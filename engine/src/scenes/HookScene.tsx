import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { z } from 'zod';
import { cameraAt, addCamera, shake } from '../engine/camera/camera';
import { DepthLayer, Stage } from '../engine/camera/Stage';
import { WaterGlints } from '../engine/fx/WaterGlints';
import { ease } from '../engine/motion/easing';
import { sceneBase } from '../engine/scene/schema';
import { useLayout } from '../engine/scene/layout';
import { Text } from '../engine/type/Text';
import { color, depth } from '../engine/tokens';

export const hookSchema = z.object({
  ...sceneBase,
  type: z.literal('hook'),
  kicker: z.string(),
  title: z.string(),
});

/**
 * HOOK — darkness first. A line of light opens on the water, the glints
 * follow, then one minimal headline is cut out of the dark.
 */
export const HookScene: React.FC<z.infer<typeof hookSchema>> = ({ kicker, title }) => {
  const L = useLayout();
  const { t, duration, unit } = L;
  const light = interpolate(t, [0.3, 2.8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.camera });
  const line = interpolate(t, [0.2, 1.9], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.arrive });
  const cam = addCamera(
    cameraAt([{ t: 0, zoom: 1, y: 0 }, { t: duration, zoom: 1.14, y: 26 }], t),
    shake('hook', t, 3, 0.5),
  );
  const horizon = 0.5;
  const exitAt = duration - 1.25;
  return (
    <AbsoluteFill style={{ background: color.void }}>
      <Stage cam={cam}>
        <DepthLayer z={depth.back}>
          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, ${color.void} 0%, #060a14 ${horizon * 100}%, #03050a 100%)`,
            }}
          />
        </DepthLayer>
        <DepthLayer z={depth.mid}>
          <WaterGlints intensity={light} horizon={horizon} spread={0.75} speed={0.8} />
          <div
            style={{
              position: 'absolute',
              top: L.h * horizon * unit - 1.5 * unit,
              left: '50%',
              width: `${line * 92}%`,
              height: 3 * unit,
              transform: 'translateX(-50%)',
              background: `linear-gradient(90deg, transparent, ${color.causticHot}, transparent)`,
              boxShadow: `0 0 ${30 * unit}px ${6 * unit}px rgba(159,212,255,${0.35 * line})`,
              opacity: line,
            }}
          />
        </DepthLayer>
        <DepthLayer z={depth.type}>
          <div style={L.at(L.margin, L.h * (L.portrait ? 0.24 : 0.16), L.measure)}>
            <Text text={kicker} size="kicker" weight={600} tracking="whisper" color={color.mist} move="Rise" at={1.1} exit={{ at: exitAt }} upper />
            <div style={{ height: 34 * unit }} />
            <Text text={title} size={128} move="Reveal" split="words" stagger={0.16} at={2.0} exit={{ at: exitAt }} />
          </div>
        </DepthLayer>
      </Stage>
    </AbsoluteFill>
  );
};
