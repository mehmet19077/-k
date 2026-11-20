import React from 'react';
import { interpolate, Sequence, staticFile } from 'remotion';
import { Audio } from '@remotion/media';
import type { TimelineEntry } from '../scene/timeline';
import type { SoundCue } from '../scene/schema';

/**
 * Sound layer of a film: one music bed plus sound cues placed relative
 * to their scene, so re-timing a scene moves its sounds with it.
 */
export const SoundTrack: React.FC<{
  totalFrames: number;
  fps: number;
  music?: { src: string; volume: number; fadeIn: number; fadeOut: number };
  cues: { entry: TimelineEntry; cues: SoundCue[] }[];
}> = ({ totalFrames, fps, music, cues }) => (
  <>
    {music ? (
      <Audio
        src={staticFile(music.src)}
        volume={(f) =>
          music.volume *
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
