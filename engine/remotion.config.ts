import { Config } from '@remotion/cli/config';

// Central render defaults for every NON STOP film.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setConcurrency(4);
Config.setEntryPoint('./src/index.ts');

// Optional: use an already-installed Chrome / headless shell instead of
// Remotion's auto-download (useful offline or in CI containers).
Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE ?? null);
