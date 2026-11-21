import React, { useMemo } from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { TransitionSeries } from '@remotion/transitions';
import { SoundTrack } from '../engine/audio/SoundTrack';
import { Finish } from '../engine/fx/Finish';
import { loadBrandFonts } from '../engine/fonts';
import { computeTimeline } from '../engine/scene/timeline';
import { nsTransition } from '../engine/transitions/presentations';
import { color } from '../engine/tokens';
import { SCENES } from '../scenes';
import type { FilmSpec } from './schema';

loadBrandFonts();

/**
 * Turns a FilmSpec into a video: scenes on a TransitionSeries, the sound
 * layer cut to the same timeline, and the finishing pass on top.
 */
export const Film: React.FC<FilmSpec> = (film) => {
  const { fps } = useVideoConfig();
  const timeline = useMemo(() => computeTimeline(film, fps), [film, fps]);

  return (
    <AbsoluteFill style={{ background: color.void }}>
      <TransitionSeries>
        {film.scenes.flatMap((scene, i) => {
          const Scene = SCENES[scene.type] as React.FC<typeof scene>;
          const entry = timeline.entries[i];
          const nodes: React.ReactNode[] = [];
          if (i > 0 && scene.transition && scene.transition.type !== 'cut') {
            const { presentation, timing } = nsTransition(scene.transition, fps);
            nodes.push(<TransitionSeries.Transition key={`${scene.id}-in`} presentation={presentation} timing={timing} />);
          }
          nodes.push(
            <TransitionSeries.Sequence key={scene.id} durationInFrames={entry.durationInFrames} name={`${scene.type}: ${scene.id}`}>
              <Scene {...scene} />
            </TransitionSeries.Sequence>,
          );
          return nodes;
        })}
      </TransitionSeries>
      <Finish grain={film.finish.grain} vignette={film.finish.vignette} />
      <SoundTrack
        fps={fps}
        totalFrames={timeline.totalFrames}
        music={film.music}
        cues={film.scenes.map((s, i) => ({
          entry: timeline.entries[i],
          cues: [
            ...(s.sound ?? []),
            // A generated voice line plays as a cue and ducks the music for its length.
            ...(s.voice?.src ? [{ src: s.voice.src, at: s.voice.at, volume: s.voice.volume, duck: s.voice.duration }] : []),
          ],
        }))}
      />
    </AbsoluteFill>
  );
};
