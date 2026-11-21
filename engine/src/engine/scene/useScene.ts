import { useCurrentFrame, useVideoConfig } from 'remotion';
import { layoutUnit } from '../formats';

/** Everything a scene needs to lay itself out and animate in seconds. */
export const useScene = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const unit = layoutUnit(width, height);
  return {
    frame,
    fps,
    /** Scene-local time in seconds. */
    t: frame / fps,
    width,
    height,
    unit,
    /** Width in layout units (1080 on vertical). */
    w: width / unit,
    h: height / unit,
    portrait: height > width,
    duration: durationInFrames / fps,
  };
};
