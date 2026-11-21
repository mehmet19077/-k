/**
 * Generates every sound the films use:
 *   public/sfx/*.wav          the NON STOP sound-effect palette
 *   public/audio/<film>.wav   a score cut to each film's timeline
 * Run: npm run audio   (Node >= 22.18, native TypeScript stripping)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeWav } from './audio/dsp.ts';
import * as sfx from './audio/sfx.ts';
import { ambientBed, buildScore, type ScoreFilm } from './audio/score.ts';

const FPS = 30;
const root = join(import.meta.dirname, '..');
const out = (p: string) => join(root, 'public', p);

const palette: Record<string, () => ReturnType<typeof sfx.impact>> = {
  impact: sfx.impact,
  whoosh: () => sfx.whoosh(0.8),
  riser: () => sfx.riser(1.9),
  shimmer: sfx.shimmer,
  paper: sfx.paper,
  tear: sfx.tear,
  glint: sfx.glint,
  sub: sfx.sub,
  hit: sfx.hit,
  rewind: () => sfx.rewind(0.65),
};

for (const [name, make] of Object.entries(palette)) {
  writeWav(out(`sfx/${name}.wav`), make());
  console.log(`sfx/${name}.wav`);
}

const films: Record<string, string> = {
  'disiplin-score': 'src/films/disiplin.json',
  'kara-antrenman-score': 'src/films/kara-antrenman.json',
  'havuz-score': 'src/films/havuz.json',
};
for (const [name, file] of Object.entries(films)) {
  const film = JSON.parse(readFileSync(join(root, file), 'utf8')) as ScoreFilm;
  writeWav(out(`audio/${name}.wav`), buildScore(film, FPS));
  console.log(`audio/${name}.wav`);
}

writeWav(out('audio/ambient-bed.wav'), ambientBed(40));
console.log('audio/ambient-bed.wav');
