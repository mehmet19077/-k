/**
 * Review stills + contact sheet.
 *   node scripts/stills.ts --comp=DisiplinYetenek --times=0.5,2,4 [--out=out/stills]
 * Without --times, takes one frame every second.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { renderStill, selectComposition } from '@remotion/renderer';
import { arg, browserExecutable, bundleProject, root } from './shared.ts';

const id = arg('comp', 'DisiplinYetenek')!;
const outDir = join(root, arg('out', `out/stills/${id}`)!);
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundleProject();
const composition = await selectComposition({ serveUrl, id, browserExecutable });
const fps = composition.fps;
const total = composition.durationInFrames / fps;
const times = arg('times')
  ? arg('times')!.split(',').map(Number)
  : Array.from({ length: Math.floor(total) }, (_, i) => i + 0.5);

const files: string[] = [];
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * fps));
  const output = join(outDir, `t_${t.toFixed(2)}.jpg`);
  await renderStill({ serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 85, scale: 0.5, browserExecutable });
  files.push(output);
  console.log(output);
}

// Contact sheet with ffmpeg's tile filter.
const cols = Math.min(6, files.length);
const rows = Math.ceil(files.length / cols);
const sheet = join(outDir, 'contact-sheet.jpg');
const inputs = files.flatMap((f) => ['-i', f]);
const filter =
  files.map((_, i) => `[${i}:v]scale=270:-1,drawtext=text='${times[i].toFixed(1)}s':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.5[v${i}]`).join(';') +
  `;${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${files
    .map((_, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = c === 0 ? '0' : Array.from({ length: c }, () => 'w0').join('+');
      const y = r === 0 ? '0' : Array.from({ length: r }, () => 'h0').join('+');
      return `${x}_${y}`;
    })
    .join('|')}:fill=black`;
if (files.length > 1) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, sheet]);
  console.log(`${sheet}  (${cols}x${rows})`);
}
