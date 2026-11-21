import React from 'react';
import { interpolate, Sequence, staticFile } from 'remotion';
import { Audio } from '@remotion/media';
import type { TimelineEntry } from '../scene/timeline';
import type { SoundCue } from '../scene/schema';

/** Music level under a voice cue, and the ramp in/out, in seconds. */
const DUCK_LEVEL = 0.38;
const DUCK_RAMP = 0.15;

/**
 * Sound layer of a film: one music bed plus sound cues placed relative
 * to their scene, so re-timing a scene moves its sounds with it.
 */
export const SoundTrack: React.FC<{
  totalFrames: number;
  fps: number;
  music?: { src: string; volume: number; fadeIn: number; fadeOut: number };
  cues: { entry: TimelineEntry; cues: SoundCue[] }[];
}> = ({ totalFrames, fps, music, cues }) => {
  const windows = cues.flatMap(({ entry, cues: list }) =>
    list
      .filter((c) => c.duck)
      .map((c) => {
        const from = (entry.from + c.at * fps) / fps;
        return [from, from + (c.duck ?? 0)] as const;
      }),
  );
  /** 1 = full music, DUCK_LEVEL = under a voice; smooth ramps either side. */
  const duck = (f: number) => {
    const t = f / fps;
    let g = 1;
    for (const [a, b] of windows) {
      const k = interpolate(t, [a - DUCK_RAMP, a, b, b + DUCK_RAMP * 2], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      g = Math.min(g, 1 - (1 - DUCK_LEVEL) * k);
    }
    return g;
  };
  return (
    <>
      {music ? (
        <Audio
          src={staticFile(music.src)}
          volume={(f) =>
            music.volume *
            duck(f) *
            interpolate(
              f,
              [0, Math.max(1, music.fadeIn * fps), totalFrames - music.fadeOut * fps, totalFrames],
              [0, 1, 1, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            )
          }
        />
      ) : null}
      {cues.flatMap(({ entry, cues: list }) =>
        list.map((cue, i) => {
          const from = Math.max(0, entry.from + Math.round(cue.at * fps));
          return (
            <Sequence key={`${entry.id}-${i}`} from={from} layout="none" name={`sfx ${entry.id}: ${cue.src}`}>
              <Audio src={staticFile(cue.src)} volume={cue.volume} />
            </Sequence>
          );
        }),
      )}
    </>
  );
};
