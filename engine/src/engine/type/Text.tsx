import React from 'react';
import { interpolate } from 'remotion';
import { animate, type MoveName, type Pose } from '../motion/motion';
import { ease } from '../motion/easing';
import { useScene } from '../scene/useScene';
import { color as palette, font, tracking as trackingTokens, type as typeScale } from '../tokens';

export type TextProps = {
  text: string;
  /** Size in layout units, or a type-scale token. */
  size?: number | keyof typeof typeScale;
  weight?: 400 | 500 | 600 | 700 | 800;
  tracking?: number | keyof typeof trackingTokens;
  color?: string;
  move?: MoveName;
  /** Entrance time in scene seconds. */
  at?: number;
  exit?: { move?: MoveName; at: number };
  split?: 'none' | 'words' | 'letters';
  /** Seconds between split units. */
  stagger?: number;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  upper?: boolean;
  /** Light sweep across the glyphs. */
  sweep?: { at: number; duration?: number };
  /** Chromatic split in layout units (0 = off). */
  chroma?: number;
  style?: React.CSSProperties;
};

/**
 * The single text primitive of the engine. Every on-screen word goes
 * through here so type always moves with the NS vocabulary.
 */
export const Text: React.FC<TextProps> = ({
  text,
  size = 'title',
  weight = 800,
  tracking = 'tight',
  color = palette.ice,
  move = 'Rise',
  at = 0,
  exit,
  split = 'none',
  stagger = 0.05,
  align = 'left',
  lineHeight = 0.98,
  upper = false,
  sweep,
  chroma = 0,
  style,
}) => {
  const { t, unit } = useScene();
  const px = (typeof size === 'number' ? size : typeScale[size]) * unit;
  const track = typeof tracking === 'number' ? tracking : trackingTokens[tracking];
  const content = upper ? text.toLocaleUpperCase('tr-TR') : text;
  const lines = content.split('\n');

  let index = 0;
  const unitPose = (): Pose => animate(t, move, at + index++ * stagger, exit);

  const chromaShadow =
    chroma > 0
      ? `${chroma * unit}px 0 rgba(255,60,70,0.75), ${-chroma * unit}px 0 rgba(80,200,255,0.75)`
      : undefined;

  const renderUnit = (s: string, key: React.Key, pose: Pose, inline: boolean) => {
    const masked = move === 'Reveal';
    const inner: React.CSSProperties = {
      display: 'inline-block',
      whiteSpace: 'pre',
      opacity: pose.opacity,
      transform: `translate3d(${pose.x * unit}px, ${(pose.y + (masked ? (1 - pose.reveal) * 130 : 0)) * unit}px, 0) scale(${pose.scale}) rotate(${pose.rotate}deg)`,
      filter: pose.blur > 0.05 ? `blur(${pose.blur * unit}px)` : undefined,
      letterSpacing: `${track + pose.tracking}em`,
      textShadow: chromaShadow,
    };
    const el = <span style={inner}>{s}</span>;
    if (!masked) return <React.Fragment key={key}>{el}</React.Fragment>;
    return (
      <span
        key={key}
        style={{
          display: inline ? 'inline-block' : 'block',
          overflow: 'hidden',
          verticalAlign: 'top',
          paddingBottom: '0.08em',
          marginBottom: '-0.08em',
        }}
      >
        {el}
      </span>
    );
  };

  const sweepPos =
    sweep !== undefined
      ? interpolate(t, [sweep.at, sweep.at + (sweep.duration ?? 1.1)], [130, -30], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: ease.wipe,
        })
      : null;

  return (
    <div
      style={{
        position: 'relative',
        fontFamily: font.display,
        fontWeight: weight,
        fontSize: px,
        lineHeight,
        color,
        textAlign: align,
        ...style,
      }}
    >
      {lines.map((line, li) => {
        let units: string[];
        if (split === 'letters') units = Array.from(line);
        else if (split === 'words') units = line.split(/(\s+)/).filter((u) => u.length > 0);
        else units = [line];
        return (
          <div key={li} style={{ whiteSpace: 'pre' }}>
            {units.map((u, ui) =>
              /^\s+$/.test(u) ? <span key={ui}>{u}</span> : renderUnit(u, ui, unitPose(), split !== 'none'),
            )}
          </div>
        );
      })}
      {sweepPos !== null && sweepPos > -30 && sweepPos < 130 ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            letterSpacing: `${track}em`,
            color: 'transparent',
            backgroundImage:
              'linear-gradient(105deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 60%)',
            backgroundSize: '250% 100%',
            backgroundPosition: `${sweepPos}% 0`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            mixBlendMode: 'screen',
          }}
        >
          {lines.map((line, li) => (
            <div key={li} style={{ whiteSpace: 'pre' }}>
              {line}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
