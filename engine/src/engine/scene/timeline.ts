/**
 * Pure timeline maths, shared by the renderer and by the audio score
 * generator (scripts/generate-audio.ts runs this file directly in Node),
 * so picture and sound are always cut to the same frames.
 * Keep this file free of imports.
 */
export type TimelineInput = {
  scenes: { id: string; duration: number; transition?: { type: string; duration: number } }[];
};

export type TimelineEntry = {
  id: string;
  index: number;
  /** Absolute first frame of the scene (including its incoming overlap). */
  from: number;
  durationInFrames: number;
  /** Frames this scene overlaps the previous one. */
  transitionInFrames: number;
};

export const toFrames = (s: number, fps: number): number => Math.round(s * fps);

export const computeTimeline = (
  film: TimelineInput,
  fps: number,
): { entries: TimelineEntry[]; totalFrames: number } => {
  let cursor = 0;
  const entries = film.scenes.map((scene, index) => {
    const durationInFrames = toFrames(scene.duration, fps);
    const t = scene.transition;
    const transitionInFrames =
      index === 0 || !t || t.type === 'cut' ? 0 : toFrames(t.duration, fps);
    const from = cursor - transitionInFrames;
    cursor = from + durationInFrames;
    return { id: scene.id, index, from, durationInFrames, transitionInFrames };
  });
  return { entries, totalFrames: cursor };
};
