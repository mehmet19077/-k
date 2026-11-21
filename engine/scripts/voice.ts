/**
 * Brand voice-over: generates every scene's `voice.text` with the voice in
 * voice.config.json and writes `voice.src` + `voice.duration` back into the
 * film JSON. Lines whose text is unchanged are not regenerated (no credits spent).
 *   ELEVENLABS_API_KEY=... node scripts/voice.ts --film=src/films/<name>.json
 * The key is read from the environment only; never commit it.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { arg, root } from './shared.ts';

type Voice = { text: string; at: number; src?: string; duration?: number; volume?: number };
type Film = { scenes: { id: string; voice?: Voice }[] };

const cfg = JSON.parse(readFileSync(join(root, 'voice.config.json'), 'utf8'));
const key = process.env.ELEVENLABS_API_KEY;
const filmPath = join(root, arg('film') ?? '');
if (!cfg.voiceId) throw new Error(`voice.config.json: set voiceId for "${cfg.voiceName}"`);
if (!existsSync(filmPath)) throw new Error('Pass --film=src/films/<name>.json');

const film = JSON.parse(readFileSync(filmPath, 'utf8')) as Film;
const name = basename(filmPath, '.json');
const dir = join(root, 'public', 'vo', name);
mkdirSync(dir, { recursive: true });

for (const scene of film.scenes) {
  const v = scene.voice;
  if (!v) continue;
  const hash = createHash('sha1').update(JSON.stringify([cfg.voiceId, cfg.model, cfg.settings, v.text])).digest('hex').slice(0, 8);
  const rel = `vo/${name}/${scene.id}-${hash}.mp3`;
  const out = join(root, 'public', rel);
  if (!existsSync(out)) {
    if (!key) throw new Error('ELEVENLABS_API_KEY is not set');
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.voiceId}?output_format=${cfg.outputFormat}`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: v.text, model_id: cfg.model, language_code: cfg.language, voice_settings: cfg.settings }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status} for "${scene.id}": ${(await res.text()).slice(0, 300)}`);
    writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  }
  const duration = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString().trim(),
  );
  v.src = rel;
  v.duration = Math.round(duration * 100) / 100;
  console.log(`${scene.id}: ${v.duration}s  ${v.text}`);
}

writeFileSync(filmPath, JSON.stringify(film, null, 2) + '\n');
