import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile } from 'remotion';
import { z } from 'zod';
import { addCamera, cameraAt, shake } from '../engine/camera/camera';
import { DepthLayer, Stage } from '../engine/camera/Stage';
import { Halftone, Paper } from '../engine/collage/Paper';
import { animate, poseStyle } from '../engine/motion/motion';
import { ease } from '../engine/motion/easing';
import { sceneBase } from '../engine/scene/schema';
import { useLayout } from '../engine/scene/layout';
import { color, depth, font } from '../engine/tokens';
import { Headline } from './parts/Headline';

export const photoSchema = z.object({
  ...sceneBase,
  type: z.literal('photo'),
  /** Path under public/. */
  src: z.string(),
  /** Pixel size of the source image (keeps the print's aspect ratio). */
  size: z.tuple([z.number(), z.number()]),
  /** full: full-bleed graded plate with a camera push. print: torn print in a collage. */
  mode: z.enum(['full', 'print']),
  /** Point the camera pushes toward, as fractions of the image. */
  focus: z.tuple([z.number(), z.number()]).default([0.5, 0.4]),
  kicker: z.string().optional(),
  title: z.string(),
  titlePosition: z.enum(['top', 'bottom']).default('bottom'),
  labels: z.array(z.string()).max(3).default([]),
});

/**
 * PHOTO — user photographs in the house style. A cold, slightly
 * desaturated grade, film grain from the finish pass, and motion that
 * respects the picture: a slow push toward a chosen focus point, or a
 * torn print that lands in the collage on stop-motion steps.
 */
export const PhotoScene: React.FC<z.infer<typeof photoSchema>> = (props) =>
  props.mode === 'full' ? <FullPlate {...props} /> : <Print {...props} />;

const grade: React.CSSProperties = { filter: 'contrast(1.08) saturate(0.82) brightness(0.92)' };

const FullPlate: React.FC<z.infer<typeof photoSchema>> = ({ src, focus, kicker, title, titlePosition }) => {
  const L = useLayout();
  const { t, duration, unit, w, h } = L;
  const plate = animate(t, 'Focus', 0);
  const push = interpolate(t, [0, duration], [1.04, 1.16], { easing: ease.camera });
  const fx = (focus[0] - 0.5) * 100;
  const fy = (focus[1] - 0.5) * 100;
  const drift = interpolate(t, [0, duration], [0, 1], { easing: ease.camera });
  const exitAt = duration - 0.9;
  const textTop = titlePosition === 'top' ? h * 0.1 : h * (L.portrait ? 0.775 : 0.66);
  return (
    <AbsoluteFill style={{ background: color.void }}>
      <AbsoluteFill style={{ ...poseStyle(plate, unit), overflow: 'hidden' }}>
        <Img
          src={staticFile(src)}
          style={{
            ...grade,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`,
            transform: `scale(${push}) translate(${-fx * 0.12 * drift}%, ${-fy * 0.12 * drift}%)`,
            transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`,
          }}
        />
        {/* Cold tint + legibility gradient toward the title. */}
        <AbsoluteFill style={{ background: 'rgba(11,26,61,0.28)', mixBlendMode: 'multiply' }} />
        <AbsoluteFill
          style={{
            background:
              titlePosition === 'top'
                ? `linear-gradient(180deg, ${color.void} 0%, rgba(4,6,11,0.6) 30%, rgba(4,6,11,0) 55%)`
                : `linear-gradient(0deg, ${color.void} 0%, rgba(4,6,11,0.75) 28%, rgba(4,6,11,0) 55%)`,
          }}
        />
      </AbsoluteFill>
      <div style={L.at(L.margin, textTop, w - L.margin * 2)}>
        <Headline kicker={kicker} title={title} at={0.7} exitAt={exitAt} size={100} />
      </div>
    </AbsoluteFill>
  );
};

const Print: React.FC<z.infer<typeof photoSchema>> = ({ src, size, kicker, title, labels, accent }) => {
  const L = useLayout();
  const { t, duration, unit, w, h, portrait } = L;
  const cam = addCamera(cameraAt([{ t: 0, zoom: 1 }, { t: duration, zoom: 1.08 }], t), shake('print', t, 4, 0.6));
  const printW = Math.min(w - L.margin * 1.2, portrait ? 960 : 1100);
  const printH = (printW * size[1]) / size[0];
  const cx = w / 2;
  const cy = portrait ? h * 0.56 : h * 0.58;
  const exitAt = duration - 0.9;
  const tags: [number, number, number][] = [
    [cx - printW * 0.32, cy - printH / 2 - 30, -5],
    [cx + printW * 0.3, cy + printH / 2 + 20, 4],
    [cx - printW * 0.25, cy + printH / 2 + 70, -2],
  ];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${color.steel} 0%, ${color.ink} 60%, ${color.void} 100%)` }}>
      <Stage cam={cam}>
        <DepthLayer z={depth.back}>
          <AbsoluteFill
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, rgba(238,243,250,0.035) 0px, rgba(238,243,250,0.035) ${2 * unit}px, transparent ${2 * unit}px, transparent ${46 * unit}px)`,
            }}
          />
        </DepthLayer>
        <DepthLayer z={depth.mid}>
          <Paper x={cx} y={cy} w={printW + 36} h={printH + 36} rotate={-1.5} at={0.1} from="bottom" seed="print-frame" fill={color.bone}>
            <div style={{ position: 'absolute', inset: 18 * unit, overflow: 'hidden' }}>
              <Img src={staticFile(src)} style={{ ...grade, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, opacity: 0.18, mixBlendMode: 'multiply' }}>
                <Halftone dot={7} />
              </div>
            </div>
          </Paper>
          {labels.map((label, i) => (
            <Paper key={i} x={tags[i][0]} y={tags[i][1]} w={Math.max(200, label.length * 30 + 80)} h={88} rotate={tags[i][2]} at={0.75 + i * 0.25} from={i % 2 ? 'right' : 'left'} seed={`tag${i}`} fill={i === 0 ? color[accent ?? 'signal'] : color.bone}>
              <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 36 * unit, letterSpacing: '0.12em', color: i === 0 ? color.ice : color.ink }}>
                  {label}
                </span>
              </AbsoluteFill>
            </Paper>
          ))}
        </DepthLayer>
        <DepthLayer z={depth.type}>
          <div style={L.at(L.margin, h * (portrait ? 0.11 : 0.06), w - L.margin * 2)}>
            <Headline kicker={kicker} title={title} at={1.0} exitAt={exitAt} size={100} />
          </div>
        </DepthLayer>
      </Stage>
    </AbsoluteFill>
  );
};
