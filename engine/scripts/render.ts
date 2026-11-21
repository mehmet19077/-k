/**
 * Final render: bundles once, renders one or more compositions to MP4
 * (H.264 CRF 20 / x264 slow, AAC 320k, yuv420p), masters the audio to
 * -14 LUFS integrated / -1.5 dBTP (two-pass loudnorm, video copied
 * untouched) and verifies the output with ffprobe.
 *   node scripts/render.ts --comp=DisiplinYetenek[,DisiplinYetenek-16x9] [--out=out]
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { renameSync } from 'node:fs';
import { join } from 'node:path';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { arg, browserExecutable, bundleProject, root } from './shared.ts';

const NAMES: Record<string, string> = {
  DisiplinYetenek: 'Disiplin_Yetenekten_Once_9x16.mp4',
  'DisiplinYetenek-16x9': 'Disiplin_Yetenekten_Once_16x9.mp4',
  'DisiplinYetenek-1x1': 'Disiplin_Yetenekten_Once_1x1.mp4',
  KaraAntrenman: 'NonStop_Kara_Antrenmani_9x16.mp4',
  Havuz: 'NonStop_Havuz_9x16.mp4',
};

const ids = arg('comp', 'DisiplinYetenek')!.split(',');
const outDir = join(root, arg('out', 'out')!);
const serveUrl = await bundleProject();

for (const id of ids) {
  const composition = await selectComposition({ serveUrl, id, browserExecutable });
  const outputLocation = join(outDir, NAMES[id] ?? `${id}.mp4`);
  const started = Date.now();
  let last = -1;
  await renderMedia({
    serveUrl,
    composition,
    codec: 'h264',
    crf: 20,
    x264Preset: 'slow',
    pixelFormat: 'yuv420p',
    audioCodec: 'aac',
    audioBitrate: '320k',
    imageFormat: 'jpeg',
    jpegQuality: 92,
    outputLocation,
    browserExecutable,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last) {
        last = pct;
        console.log(`${id}: ${pct}%`);
      }
    },
  });
  master(outputLocation);
  const probe = execFileSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames:format=duration,size',
    '-of', 'compact', outputLocation,
  ]).toString();
  console.log(`${outputLocation}\n  rendered in ${((Date.now() - started) / 1000).toFixed(0)}s\n${probe}`);
}

/** Two-pass EBU R128 loudness normalisation of the audio stream only. */
function master(file: string) {
  const target = 'I=-14:TP=-1.5:LRA=11';
  const pass1 = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-'], {
    encoding: 'utf8',
  });
  const json = pass1.stderr.slice(pass1.stderr.lastIndexOf('{'), pass1.stderr.lastIndexOf('}') + 1);
  if (pass1.status !== 0 || !json) throw new Error(`loudnorm analysis failed for ${file}`);
  const m = JSON.parse(json) as Record<string, string>;
  const tmp = file.replace(/\.mp4$/, '.mastering.mp4');
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', file,
    '-c:v', 'copy',
    '-af', `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`,
    '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', tmp,
  ]);
  renameSync(tmp, file);
  console.log(`  mastered: ${m.input_i} LUFS -> -14 LUFS (TP ${m.input_tp} dBTP in)`);
}
