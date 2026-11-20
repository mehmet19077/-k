import { useScene } from './useScene';
import { safeArea } from '../tokens';

/** Format-aware layout: margins and anchor points in layout units. */
export const useLayout = () => {
  const s = useScene();
  const margin = Math.round(Math.min(s.w, s.h) * safeArea.margin) + (s.portrait ? 6 : 40);
  return {
    ...s,
    margin,
    /** Usable text width. */
    measure: s.w - margin * 2,
    /** y position by fraction of height. */
    y: (f: number) => s.h * f,
    /** Absolute-position style for a block at (left, top) in layout units. */
    at: (left: number, top: number, width?: number): React.CSSProperties => ({
      position: 'absolute',
      left: left * s.unit,
      top: top * s.unit,
      width: width !== undefined ? width * s.unit : undefined,
    }),
  };
};
