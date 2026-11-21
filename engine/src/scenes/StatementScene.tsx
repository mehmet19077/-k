import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { z } from 'zod';
import { cameraAt } from '../engine/camera/camera';
import { DepthLayer, Stage } from '../engine/camera/Stage';
import { WaterGlints } from '../engine/fx/WaterGlints';
import { ease } from '../engine/motion/easing';
import { sceneBase } from '../engine/scene/schema';
import { useLayout } from '../engine/scene/layout';
import { Text } from '../engine/type/Text';
import { color, depth } from '../engine/tokens';

export const statementSchema = z.object({
  ...sceneBase,
  type: z.literal('statement'),
  lines: z.array(z.string()).min(1).max(4),
  /** Index of the line drawn in the accent colour (-1 for none). */
  emphasis: z.number().default(-1),
  /** Seconds after the start when the lines begin. */
  start: z.number().default(0.6),
});

/**
 * STATEMENT / RESOLUTION — the picture calms: slow swell, slow camera,
 * lines settle into focus one after another; a single rule draws under
 * the message.
 */
export const StatementScene: React.FC<z.infer<typeof statementSchema>> = ({ lines, emphasis, start, accent }) => {
  const L = useLayout();
  const { t, duration, unit } = L;
  const cam = cameraAt([{ t: 0, zoom: 1.06, y: -20 }, { t: duration, zoom: 1, y: 10 }], t);
  const lineGap = 0.42;
  const ruleAt = start + lines.length * lineGap + 0.4;
  const rule = interpolate(t, [ruleAt, ruleAt + 0.9], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.arrive });
  const exitAt = duration - 1.3;
  const accentColor = color[accent ?? 'signal'];
  return (
    <AbsoluteFill style={{ background: color.void }}>
      <Stage cam={cam}>
        <DepthLayer z={depth.back}>
          <AbsoluteFill style={{ background: `linear-gradient(180deg, ${color.void} 0%, #060b16 62%, #02040a 100%)` }} />
          <WaterGlints intensity={0.42} horizon={0.66} spread={0.55} speed={0.45} seed="calm" />
        </DepthLayer>
        <DepthLayer z={depth.type}>
          <div style={L.at(L.margin, L.h * (L.portrait ? 0.28 : 0.2), L.measure)}>
            {lines.map((line, i) => (
              <Text
                key={i}
                text={line}
                size="title"
                move="Focus"
                at={start + i * lineGap}
                exit={{ move: 'Fade', at: exitAt }}
                color={i === emphasis ? color.caustic : color.ice}
                lineHeight={1.08}
              />
            ))}
            <div
              style={{
                marginTop: 44 * unit,
                width: 180 * unit,
                height: 8 * unit,
                background: accentColor,
                transform: `scaleX(${rule})`,
                transformOrigin: '0% 50%',
                opacity: interpolate(t, [exitAt, exitAt + 0.8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              }}
            />
          </div>
        </DepthLayer>
      </Stage>
    </AbsoluteFill>
  );
};
