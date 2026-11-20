import { bundle } from '@remotion/bundler';
import { join } from 'node:path';

export const root = join(import.meta.dirname, '..');

/** Bundle the project once; every still / render in a run reuses it. */
export const bundleProject = () =>
  bundle({ entryPoint: join(root, 'src/index.ts'), publicDir: join(root, 'public') });

export const arg = (name: string, fallback?: string): string | undefined => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

/** Same switch as remotion.config.ts: null lets Remotion download its own headless shell. */
export const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;
