import React from 'react';
import { Composition, type CalculateMetadataFunction } from 'remotion';
import { FORMATS, type FormatId } from './engine/formats';
import { computeTimeline } from './engine/scene/timeline';
import { FPS } from './engine/timing';
import { Film } from './film/Film';
import { filmSchema, type FilmSpec } from './film/schema';
import disiplin from './films/disiplin.json';
import karaAntrenman from './films/kara-antrenman.json';
import { composeFilm } from './story/compose';

/** Duration always follows the film spec, so editing scenes in the Studio re-times the composition. */
const fromSpec: CalculateMetadataFunction<FilmSpec> = ({ props }) => {
  const parsed = filmSchema.parse(props);
  return { durationInFrames: computeTimeline(parsed, FPS).totalFrames, props: parsed };
};

const disiplinFilm = filmSchema.parse(disiplin);
/** Uses photos from public/private/ (git-ignored: people's photos never go to the public repo). */
const karaAntrenmanFilm = filmSchema.parse(karaAntrenman);

/** Same story, written by the composer from a brief in "minimal" mode. */
const composed = composeFilm({
  title: 'Disiplin — minimal kurgu',
  mode: 'minimal',
  duration: 15,
  fps: FPS,
  logo: 'brand/logo.png',
  copy: {
    hook: { kicker: '05:47 · havuz boş', title: 'Kimse\nizlemiyor.' },
    resolution: { lines: ['Disiplin,', 'yetenekten', 'önce gelir.'], emphasis: 2 },
    ending: { wordmark: 'Non Stop · Spor Kulübü', tagline: 'Her gün. Durmadan.' },
  },
});

const variants: { id: string; format: FormatId }[] = [
  { id: 'DisiplinYetenek', format: 'vertical' },
  { id: 'DisiplinYetenek-16x9', format: 'landscape' },
  { id: 'DisiplinYetenek-1x1', format: 'square' },
];

export const Root: React.FC = () => (
  <>
    {variants.map(({ id, format }) => (
      <Composition
        key={id}
        id={id}
        component={Film}
        schema={filmSchema}
        defaultProps={disiplinFilm}
        calculateMetadata={fromSpec}
        durationInFrames={computeTimeline(disiplinFilm, FPS).totalFrames}
        fps={FPS}
        width={FORMATS[format].width}
        height={FORMATS[format].height}
      />
    ))}
    <Composition
      id="KaraAntrenman"
      component={Film}
      schema={filmSchema}
      defaultProps={karaAntrenmanFilm}
      calculateMetadata={fromSpec}
      durationInFrames={computeTimeline(karaAntrenmanFilm, FPS).totalFrames}
      fps={FPS}
      width={FORMATS.vertical.width}
      height={FORMATS.vertical.height}
    />
    <Composition
      id="Composer-Minimal"
      component={Film}
      schema={filmSchema}
      defaultProps={composed}
      calculateMetadata={fromSpec}
      durationInFrames={computeTimeline(composed, FPS).totalFrames}
      fps={FPS}
      width={FORMATS.vertical.width}
      height={FORMATS.vertical.height}
    />
  </>
);
