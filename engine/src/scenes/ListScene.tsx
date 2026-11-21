import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { z } from 'zod';
import { addCamera, cameraAt, impactShake } from '../engine/camera/camera';
import { DepthLayer, Stage } from '../engine/camera/Stage';
import { MatFloor } from '../engine/fx/MatFloor';
import { ease } from '../engine/motion/easing';
import { sceneBase } from '../engine/scene/schema';
import { useLayout } from '../engine/scene/layout';
import { Text } from '../engine/type/Text';
import { color, depth, font } from '../engine/tokens';

export const listSchema = z.object({
  ...sceneBase,
  type: z.literal('list'),
  kicker: z.string(),
  items: z.array(z.string()).min(1).max(6),
  /** First item time and spacing in seconds: one item per beat. */
  start: z.number().default(0.5),
  beat: z.number().default(0.55),
  /** Explicit item times (e.g. word onsets of a voice-over); overrides start/beat. */
  times: z.array(z.number()).optional(),
});

/**
 * LIST — a programme / checklist that lands on the beat. Each row: an
 * outlined index, the label hitting in with a micro camera kick, and a
 * rule that draws under it. Built for drills, steps, features.
 */
export const ListScene: React.FC<z.infer<typeof listSchema>> = ({ kicker, items, start, beat, times, accent }) => {
  const L = useLayout();
  const { t, duration, unit } = L;
  const accentColor = color[accent ?? 'signal'];
  const itemAt = (i: number) => times?.[i] ?? start + i * beat;
  const kick = items.reduce(
    (cam, _, i) => addCamera(cam, impactShake(`list${i}`, t, itemAt(i), 7, 0.25)),
    cameraAt([{ t: 0, zoom: 1.02 }, { t: duration, zoom: 1.1 }], t),
  );
  const rowH = Math.min(190, (L.h * 0.62) / items.length);
  return (
    <AbsoluteFill style={{ background: color.void }}>
      <Stage cam={kick}>
        <DepthLayer z={depth.back}>
          <MatFloor z={2 + t * 1.6} horizon={0.46} light={0.8} />
        </DepthLayer>
        <DepthLayer z={depth.type}>
          <div style={L.at(L.margin, L.h * (L.portrait ? 0.16 : 0.1), L.measure)}>
            <Text text={kicker} size="kicker" weight={600} tracking="whisper" color={color.caustic} move="Rise" at={0.1} upper />
            <div style={{ height: 40 * unit }} />
            {items.map((item, i) => {
              const at = itemAt(i);
              const rule = interpolate(t, [at + 0.08, at + 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.wipe });
              return (
                <div key={i} style={{ position: 'relative', height: rowH * unit, display: 'flex', alignItems: 'center', gap: 34 * unit }}>
                  <div
                    style={{
                      width: 150 * unit,
                      fontFamily: font.display,
                      fontWeight: 800,
                      fontSize: 92 * unit,
                      color: 'transparent',
                      WebkitTextStroke: `${2 * unit}px ${accentColor}`,
                      opacity: interpolate(t, [at - 0.05, at + 0.1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <Text text={item} size={104} move="Impact" at={at} tracking="tight" />
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 2 * unit,
                      background: 'rgba(238,243,250,0.22)',
                      transform: `scaleX(${rule})`,
                      transformOrigin: '0% 50%',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </DepthLayer>
      </Stage>
    </AbsoluteFill>
  );
};
