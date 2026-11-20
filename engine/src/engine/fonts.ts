import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';
import { font } from './tokens';

/**
 * Brand typeface (Poppins, SIL OFL) bundled locally, so renders never
 * depend on a font CDN. Latin + Latin-Ext subsets cover Turkish.
 */
const WEIGHTS = [400, 500, 600, 700, 800] as const;
let loaded = false;

export const loadBrandFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('Loading NS Display font');
  const faces = WEIGHTS.flatMap((w) => [
    new FontFace(font.display, `url(${staticFile(`fonts/poppins-latin-${w}-normal.woff2`)}) format('woff2')`, {
      weight: String(w),
      unicodeRange: 'U+0000-00FF, U+2000-206F, U+20AC, U+2122',
    }),
    new FontFace(font.display, `url(${staticFile(`fonts/poppins-latin-ext-${w}-normal.woff2`)}) format('woff2')`, {
      weight: String(w),
      unicodeRange: 'U+0100-024F, U+1E00-1EFF',
    }),
  ]);
  Promise.all(faces.map((f) => f.load()))
    .then((list) => {
      list.forEach((f) => document.fonts.add(f));
      continueRender(handle);
    })
    // A missing brand font must fail the render, never fall back silently.
    .catch((err) => cancelRender(err));
};
