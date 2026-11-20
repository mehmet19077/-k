import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { linearTiming, type TransitionPresentation, type TransitionPresentationComponentProps } from '@remotion/transitions';
import { ease } from '../motion/easing';
import type { TransitionSpec } from '../scene/schema';

/**
 * NON STOP transitions. Each one is a TransitionSeries presentation; the
 * film builder picks them by name from the scene spec.
 */
type Props = { kind: TransitionSpec['type']; direction: NonNullable<TransitionSpec['direction']> };

const vector = (d: Props['direction']): [number, number] =>
  d === 'left' ? [-1, 0] : d === 'right' ? [1, 0] : d === 'up' ? [0, -1] : [0, 1];

const NSTransition: React.FC<TransitionPresentationComponentProps<Props>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps: { kind, direction },
}) => {
  const { width, height } = useVideoConfig();
  const entering = presentationDirection === 'entering';
  const short = Math.min(width, height);
  let style: React.CSSProperties = {};
  let overlay: React.ReactNode = null;

  if (kind === 'whip') {
    // Both shots travel with the camera; blur peaks mid-move.
    const [vx, vy] = vector(direction);
    const travel = entering ? p - 1 : p;
    const blur = Math.sin(p * Math.PI) * short * 0.045;
    style = {
      transform: `translate3d(${vx * travel * width * 0.9}px, ${vy * travel * height * 0.9}px, 0) scale(${1 + Math.sin(p * Math.PI) * 0.06})`,
      filter: `blur(${blur}px)`,
    };
  } else if (kind === 'flash') {
    style = { opacity: entering ? (p > 0.5 ? 1 : 0) : p > 0.5 ? 0 : 1 };
    if (entering) {
      const a = Math.pow(Math.sin(p * Math.PI), 2);
      overlay = <AbsoluteFill style={{ background: `rgba(230,246,255,${a})` }} />;
    }
  } else if (kind === 'push') {
    // Camera pushes through the outgoing shot into the next.
    if (entering) {
      // The next shot only emerges once the camera has passed through the last one.
      style = {
        opacity: ease.arrive(Math.max(0, (p - 0.4) / 0.6)),
        transform: `scale(${0.82 + 0.18 * ease.arrive(p)})`,
        filter: `blur(${(1 - p) * short * 0.02}px)`,
      };
    } else {
      style = {
        opacity: 1 - ease.depart(p),
        transform: `scale(${1 + 0.7 * ease.depart(p)})`,
        filter: `blur(${p * short * 0.03}px)`,
      };
    }
  } else if (kind === 'wipe') {
    if (entering) {
      const e = ease.wipe(p) * 130;
      style = { clipPath: `polygon(0% 100%, ${e}% 100%, ${e - 30}% 0%, 0% 0%)` };
    }
  } else if (kind === 'dissolve') {
    style = entering
      ? { opacity: ease.sine(p), filter: `blur(${(1 - p) * short * 0.008}px)` }
      : { opacity: 1 - ease.sine(p) * 0.6 };
  }

  return (
    <AbsoluteFill>
      <AbsoluteFill style={style}>{children}</AbsoluteFill>
      {overlay}
    </AbsoluteFill>
  );
};

export const nsTransition = (spec: TransitionSpec, fps: number) => {
  const presentation: TransitionPresentation<Props> = {
    component: NSTransition,
    props: { kind: spec.type, direction: spec.direction ?? 'left' },
  };
  return {
    presentation,
    timing: linearTiming({ durationInFrames: Math.max(1, Math.round(spec.duration * fps)), easing: ease.linear }),
  };
};
