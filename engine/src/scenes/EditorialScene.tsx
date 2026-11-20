import React from 'react';
import { AbsoluteFill } from 'remotion';
import { z } from 'zod';
import { addCamera, cameraAt, shake } from '../engine/camera/camera';
import { DepthLayer, Stage } from '../engine/camera/Stage';
import { Dial } from '../engine/collage/Dial';
import { Paper } from '../engine/collage/Paper';
import { sceneBase } from '../engine/scene/schema';
import { useLayout } from '../engine/scene/layout';
import { Scatter } from '../engine/type/Scatter';
import { SliceText } from '../engine/type/SliceText';
import { Text } from '../engine/type/Text';
import { color, depth, font } from '../engine/tokens';

export const editorialSchema = z.object({
  ...sceneBase,
  type: z.literal('editorial'),
  /** The word that is assembled and then torn apart. */
  word: z.string(),
  /** Line on the accent strip under the word. */
  line: z.string(),
  /** Small printed labels pinned around the collage. */
  labels: z.array(z.string()).max(3),
  /** Problem / question that forms from the debris. */
  question: z.tuple([z.string(), z.string()]),
  /** Scene second at which the collage breaks. */
  breakAt: z.number().default(3.5),
});

/**
 * EDITORIAL — paper collage built from nothing on stop-motion steps, the
 * headline sliced into register, then torn apart so a question can form
 * from the debris.
 */
export const EditorialScene: React.FC<z.infer<typeof editorialSchema>> = ({ word, line, labels, question, breakAt, accent }) => {
  const L = useLayout();
  const { t, duration, unit, w, h, portrait } = L;
  // The collage is composed once on a virtual 9:16 board and scaled to fit
  // every format, so the arrangement never breaks in 16:9 or 1:1.
  const BOARD = { w: 1080, h: 1920, contentCenter: 1080, contentHeight: 1720 };
  const k = portrait ? w / BOARD.w : h / BOARD.contentHeight;
  const boardLeft = (w - BOARD.w * k) / 2;
  const boardTop = portrait ? (h - BOARD.h * k) / 2 : h / 2 - BOARD.contentCenter * k;
  const cx = BOARD.w / 2;
  const cy = BOARD.h * 0.42;
  const strip = color[accent ?? 'signal'];
  const cam = addCamera(cameraAt([{ t: 0, zoom: 1 }, { t: duration, zoom: 1.12, y: 20 }], t), shake('edit', t, 4, 0.7));
  const paperW = 920;
  const wordSize = Math.min(220, paperW / (word.length * 0.66));
  const label = (i: number) => labels[i] ?? '';
  const labelPos: [number, number, number, 'left' | 'right' | 'top' | 'bottom'][] = [
    [cx - 250, cy - 330, -6, 'top'],
    [cx + 280, cy + 420, 4, 'right'],
    [cx - 300, cy + 540, 3, 'left'],
  ];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${color.steel} 0%, ${color.ink} 60%, ${color.void} 100%)` }}>
      <Stage cam={cam}>
        <DepthLayer z={depth.back}>
          {/* Ruled newsprint lines in the far plane. */}
          <AbsoluteFill
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, rgba(238,243,250,0.035) 0px, rgba(238,243,250,0.035) ${2 * unit}px, transparent ${2 * unit}px, transparent ${46 * unit}px)`,
            }}
          />
        </DepthLayer>
        <DepthLayer z={depth.mid}>
          <div
            style={{
              position: 'absolute',
              left: boardLeft * unit,
              top: boardTop * unit,
              width: BOARD.w * unit,
              height: BOARD.h * unit,
              transform: `scale(${k})`,
              transformOrigin: '0 0',
            }}
          >
          <Paper x={cx} y={cy} w={paperW} h={wordSize * 1.7} rotate={-2.5} at={0.05} outAt={breakAt + 0.15} from="left" seed="main" halftone>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
              <SliceText text={word} size={wordSize} at={0.3} breakAt={breakAt} color={color.ink} seed="word" />
            </AbsoluteFill>
          </Paper>
          <Paper x={cx + 60} y={cy + wordSize * 1.15} w={paperW * 0.82} h={110} rotate={1.8} at={1.0} outAt={breakAt + 0.05} from="right" seed="strip" fill={strip}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text text={line} size={54} weight={700} move="Rise" at={1.25} align="center" />
            </AbsoluteFill>
          </Paper>
          {labelPos.map(([x, y, r, from], i) =>
            label(i) ? (
              <Paper key={i} x={x} y={y} w={300} h={96} rotate={r} at={1.7 + i * 0.22} outAt={breakAt + 0.1 + i * 0.05} from={from} seed={`label${i}`} fill={i === 1 ? color.ice : color.bone}>
                <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 40 * unit, letterSpacing: '0.12em', color: color.ink }}>
                    {label(i)}
                  </span>
                </AbsoluteFill>
              </Paper>
            ) : null,
          )}
          {/* Pool-floor lane marker on brand blue: the sport, said with a shape. */}
          <Paper x={cx + 40} y={cy + 760} w={640} h={300} rotate={-1.5} at={2.45} outAt={breakAt + 0.12} from="bottom" seed="lane" fill={color.pulse} halftone>
            <div style={{ position: 'absolute', left: '8%', right: '8%', top: '46%', height: 26 * unit, background: color.ink }} />
            <div style={{ position: 'absolute', right: '8%', top: '22%', bottom: '22%', width: 26 * unit, background: color.ink }} />
          </Paper>
          <Paper x={cx + 280} y={cy - 360} w={250} h={250} rotate={5} at={2.15} outAt={breakAt + 0.2} from="top" seed="dial" fill={color.bone}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Dial size={210} at={2.3} />
            </AbsoluteFill>
          </Paper>
          </div>
        </DepthLayer>
        <DepthLayer z={depth.subject}>
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Text text={question[0]} size="lead" weight={600} color={color.mist} move="Rise" at={breakAt + 0.45} align="center" tracking="normal" />
            <div style={{ height: 18 * unit }} />
            <Scatter text={question[1]} size={150} mode="in" at={breakAt + 0.6} duration={0.9} seed="q" />
          </AbsoluteFill>
        </DepthLayer>
      </Stage>
    </AbsoluteFill>
  );
};
