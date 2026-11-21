import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { z } from 'zod';
import { addCamera, cameraAt, shake } from '../engine/camera/camera';
import { DepthLayer, Stage } from '../engine/camera/Stage';
import { CausticField } from '../engine/fx/CausticField';
import { LaneRopes } from '../engine/fx/LaneRopes';
import { Particles } from '../engine/fx/Particles';
import { WaterGlints } from '../engine/fx/WaterGlints';
import { ease } from '../engine/motion/easing';
import { sceneBase } from '../engine/scene/schema';
import { useLayout } from '../engine/scene/layout';
import { Text } from '../engine/type/Text';
import { color, depth, font } from '../engine/tokens';

export const movementSchema = z.object({
  ...sceneBase,
  type: z.literal('movement'),
  kicker: z.string(),
  lines: z.array(z.string()).min(1).max(3),
  /** Large outlined numeral in the far plane. */
  numeral: z.string().optional(),
  /** Camera speed in metres per second. */
  speed: z.number().default(3.2),
});

/**
 * MOVEMENT — a tracking shot down the lane. Five depth planes (ceiling,
 * caustic floor, water light, lane ropes, suspended particles) move at
 * their own parallax rate; the front plane is out of focus.
 */
export const MovementScene: React.FC<z.infer<typeof movementSchema>> = ({ kicker, lines, numeral, speed }) => {
  const L = useLayout();
  const { t, duration, unit } = L;
  const horizon = 0.36;
  const cam = addCamera(
    cameraAt([{ t: 0, x: -36, zoom: 1.03, roll: -1.2 }, { t: duration, x: 24, zoom: 1.08, roll: 0.8 }], t),
    shake('move', t, 6, 0.9),
  );
  const fadeIn = interpolate(t, [0, 0.9], [0, 1], { extrapolateRight: 'clamp', easing: ease.arrive });
  return (
    <AbsoluteFill style={{ background: color.void }}>
      <Stage cam={cam} focus={depth.type} dof={7}>
        <DepthLayer z={depth.far}>
          <AbsoluteFill style={{ background: `linear-gradient(180deg, #05080f 0%, #0a1426 ${horizon * 100}%, #020409 100%)` }} />
          {numeral ? (
            <div
              style={{
                position: 'absolute',
                right: -40 * unit,
                top: L.h * 0.02 * unit,
                fontFamily: font.display,
                fontWeight: 800,
                fontSize: 900 * unit,
                lineHeight: 1,
                color: 'transparent',
                WebkitTextStroke: `${2 * unit}px rgba(159,212,255,0.16)`,
                transform: `translateX(${-t * 14 * unit}px)`,
              }}
            >
              {numeral}
            </div>
          ) : null}
        </DepthLayer>
        <DepthLayer z={depth.back}>
          <div
            style={{
              position: 'absolute',
              left: '-30%',
              right: '-30%',
              top: `${horizon * 100}%`,
              bottom: '-10%',
              transform: 'perspective(900px) rotateX(58deg)',
              transformOrigin: '50% 0%',
              opacity: 0.38 * fadeIn,
              WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 30%)',
              maskImage: 'linear-gradient(180deg, transparent 0%, black 30%)',
            }}
          >
            <CausticField intensity={0.9} travel={t * speed} />
          </div>
        </DepthLayer>
        <DepthLayer z={depth.mid}>
          <WaterGlints intensity={0.55 * fadeIn} horizon={horizon} spread={1.2} speed={1.2} seed="lane" />
          <LaneRopes z={t * speed} horizon={horizon} opacity={fadeIn} />
        </DepthLayer>
        <DepthLayer z={depth.type}>
          <div style={L.at(L.margin + 30, L.h * (L.portrait ? 0.6 : 0.52), L.measure - 30)}>
            <Text text={kicker} size="kicker" weight={600} tracking="whisper" color={color.caustic} move="Rise" at={0.9} upper />
            <div style={{ height: 30 * unit }} />
            {lines.map((line, i) => (
              <Text key={i} text={line} size="title" move="Flow" split="words" stagger={0.08} at={0.45 + i * 0.75} />
            ))}
          </div>
        </DepthLayer>
        <DepthLayer z={depth.front}>
          <Particles mode="drift" count={46} seed="dust" size={5} opacity={0.6 * fadeIn} rgb="190,225,255" />
        </DepthLayer>
      </Stage>
    </AbsoluteFill>
  );
};
