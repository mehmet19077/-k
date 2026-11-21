import React from 'react';
import { AbsoluteFill, interpolate, staticFile } from 'remotion';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { addCamera, cameraAt, impactShake } from '../engine/camera/camera';
import { Flash } from '../engine/fx/Flash';
import { ease } from '../engine/motion/easing';
import { sceneBase } from '../engine/scene/schema';
import { useLayout } from '../engine/scene/layout';
import { Text } from '../engine/type/Text';
import { color } from '../engine/tokens';
import { Headline } from './parts/Headline';

export const videoSchema = z.object({
  ...sceneBase,
  type: z.literal('video'),
  /** Path under public/ (H.264 proxy in the target aspect ratio). */
  src: z.string(),
  /** Source second the scene starts from. */
  from: z.number().min(0),
  /** Playback speed; < 1 is slow motion (shoot 60 fps for clean 0.5x). */
  rate: z.number().min(0.1).max(4).default(1),
  /** Camera push over the scene (1 = none). */
  push: z.number().default(1.08),
  kicker: z.string().optional(),
  title: z.string().optional(),
  titlePosition: z.enum(['top', 'bottom']).default('bottom'),
  titleAt: z.number().default(0.5),
  /** Seconds of fade from black at the start (first scene). */
  fadeIn: z.number().default(0),
  /** Scene second of a physical hit (entry, contact): flash, shake, impact word. */
  hit: z.number().optional(),
  hitWord: z.string().optional(),
});

/**
 * VIDEO — the club's own footage in the house look: cool contrast grade,
 * controlled push, optional slow motion, and one hit synced to sound.
 */
export const VideoScene: React.FC<z.infer<typeof videoSchema>> = ({
  src,
  from,
  rate,
  push,
  kicker,
  title,
  titlePosition,
  titleAt,
  fadeIn,
  hit,
  hitWord,
}) => {
  const L = useLayout();
  const { t, duration, fps, unit, w, h } = L;
  const cam = addCamera(
    cameraAt([{ t: 0, zoom: 1 }, { t: duration, zoom: push }], t),
    hit !== undefined ? impactShake('video-hit', t, hit, 30, 0.55) : { x: 0, y: 0, zoom: 1, roll: 0 },
  );
  const black = fadeIn > 0 ? interpolate(t, [0, fadeIn], [1, 0], { extrapolateRight: 'clamp', easing: ease.sine }) : 0;
  const exitAt = duration - 0.6;
  const top = titlePosition === 'top';
  return (
    <AbsoluteFill style={{ background: color.void }}>
      <AbsoluteFill
        style={{
          transform: `translate3d(${-cam.x * unit}px, ${-cam.y * unit}px, 0) scale(${cam.zoom}) rotate(${cam.roll}deg)`,
        }}
      >
        <Video
          src={staticFile(src)}
          trimBefore={Math.round(from * fps)}
          playbackRate={rate}
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.12) saturate(0.88) brightness(0.93)' }}
        />
      </AbsoluteFill>
      {/* Cool grade + legibility toward the title. */}
      <AbsoluteFill style={{ background: 'rgba(11,26,61,0.22)', mixBlendMode: 'multiply' }} />
      {title ? (
        <AbsoluteFill
          style={{
            background: top
              ? `linear-gradient(180deg, rgba(4,6,11,0.85) 0%, rgba(4,6,11,0.35) 26%, rgba(4,6,11,0) 42%)`
              : `linear-gradient(0deg, rgba(4,6,11,0.88) 0%, rgba(4,6,11,0.4) 26%, rgba(4,6,11,0) 44%)`,
          }}
        />
      ) : null}
      {title ? (
        <div style={L.at(L.margin, top ? h * 0.1 : h * 0.72, w - L.margin * 2)}>
          <Headline kicker={kicker} title={title} at={titleAt} exitAt={exitAt} size={104} />
        </div>
      ) : null}
      {hit !== undefined && hitWord ? (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text
            text={hitWord}
            size={190}
            move="Impact"
            at={hit}
            exit={{ at: duration - 0.5 }}
            align="center"
            chroma={t < hit ? 0 : 9 * Math.exp(-(t - hit) * 7)}
            upper
            style={{ textShadow: '0 10px 40px rgba(0,0,0,0.55)' }}
          />
        </AbsoluteFill>
      ) : null}
      {hit !== undefined ? <Flash at={hit} strength={0.7} decay={0.28} /> : null}
      {black > 0 ? <AbsoluteFill style={{ background: '#000', opacity: black }} /> : null}
    </AbsoluteFill>
  );
};
