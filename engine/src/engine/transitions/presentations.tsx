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
  } else if (kind === 'zoom') {
    // Punch-in: the outgoing shot rushes at the lens, the next one lands from over-scale.
    if (entering) {
      const k = ease.arrive(Math.max(0, (p - 0.45) / 0.55));
      style = {
        opacity: Math.min(1, Math.max(0, (p - 0.42) / 0.12)),
        transform: `scale(${1.45 - 0.45 * k})`,
        filter: `blur(${(1 - k) * short * 0.025}px)`,
      };
      const bloom = Math.exp(-Math.pow((p - 0.48) / 0.12, 2));
      overlay = <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(230,246,255,${0.75 * bloom}) 0%, rgba(230,246,255,${0.25 * bloom}) 60%)` }} />;
    } else {
      const k = ease.depart(Math.min(1, p / 0.5));
      style = { transform: `scale(${1 + 0.6 * k})`, filter: `blur(${k * short * 0.03}px)` };
    }
  } else if (kind === 'rewind') {
    // Tape rewind: picture jumps and tears, colour channels split, cut at the midpoint.
    const shown = entering ? p >= 0.5 : p < 0.5;
    const strength = Math.sin(p * Math.PI);
    const jitter = Math.sin(p * 97) * 0.5 + Math.sin(p * 211) * 0.5;
    style = {
      opacity: shown ? 1 : 0,
      transform: `translate3d(${jitter * short * 0.02 * strength}px, ${Math.sin(p * 53) * short * 0.03 * strength}px, 0) skewX(${jitter * 6 * strength}deg)`,
      filter: `saturate(${1 + strength}) contrast(${1 + 0.3 * strength}) hue-rotate(${jitter * 25 * strength}deg)`,
    };
    if (entering) {
      const bands = [0.18, 0.43, 0.61, 0.8].map((y, i) => ({ y: (y + p * (i % 2 ? 1.3 : -0.9) + 1) % 1, h: 0.015 + 0.03 * ((i * 7) % 3) / 2 }));
      overlay = (
        <AbsoluteFill style={{ opacity: strength }}>
          <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 5px)' }} />
          {bands.map((b, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${b.y * 100}%`,
                height: `${b.h * 100}%`,
                background: i % 2 ? 'rgba(80,200,255,0.55)' : 'rgba(255,60,70,0.5)',
                mixBlendMode: 'screen',
                transform: `translateX(${Math.sin(p * 40 + i) * 8}%)`,
              }}
            />
          ))}
        </AbsoluteFill>
      );
    }
  } else if (kind === 'leak') {
    // Light leak: a warm/cool flare crosses the frame while the shots dissolve under it.
    style = entering ? { opacity: ease.sine(Math.min(1, Math.max(0, (p - 0.2) / 0.6))) } : {};
    if (entering) {
      const x = -30 + p * 160;
      const a = Math.sin(p * Math.PI);
      overlay = (
        <AbsoluteFill
          style={{
            mixBlendMode: 'screen',
            background: `radial-gradient(ellipse 45% 70% at ${x}% 40%, rgba(255,170,90,${0.7 * a}) 0%, rgba(255,90,60,${0.25 * a}) 40%, rgba(0,0,0,0) 70%), radial-gradient(ellipse 35% 55% at ${x + 25}% 65%, rgba(140,210,255,${0.5 * a}) 0%, rgba(0,0,0,0) 70%)`,
          }}
        />
      );
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
