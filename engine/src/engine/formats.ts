/** Output formats. Every scene lays out against `unit` so one film renders in all three. */
export type FormatId = 'vertical' | 'landscape' | 'square';

export type Format = {
  id: FormatId;
  label: string;
  width: number;
  height: number;
};

export const FORMATS: Record<FormatId, Format> = {
  vertical: { id: 'vertical', label: '9:16', width: 1080, height: 1920 },
  landscape: { id: 'landscape', label: '16:9', width: 1920, height: 1080 },
  square: { id: 'square', label: '1:1', width: 1080, height: 1080 },
};

/**
 * Layout unit: 1 unit = 1px on a 1080-wide vertical frame. Landscape and
 * square scale type down slightly by their short side so the hierarchy holds.
 */
export const layoutUnit = (width: number, height: number): number =>
  Math.min(width, height) / 1080;
