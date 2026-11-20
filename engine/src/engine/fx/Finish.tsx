import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { finish } from '../tokens';

/**
 * The finishing pass applied over every film: animated film grain,
 * optical vignette and optional letterbox. Grain is rendered at half
 * resolution and scaled up, which gives it a photographic clump size.
 */
export const Finish: React.FC<{ grain?: number; vignette?: number; letterbox?: number }> = ({
  grain = finish.grainOpacity,
  vignette = finish.vignette,
  letterbox = finish.letterbox,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const gw = Math.ceil(width / 2);
  const gh = Math.ceil(height / 2);
  const bar = Math.min(width, height) * 0.11 * letterbox;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 65% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      {grain > 0 ? (
        <svg
          width={gw}
          height={gh}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: 'scale(2)',
            transformOrigin: '0 0',
            opacity: grain,
            mixBlendMode: 'screen',
          }}
        >
          <filter id={`ns-grain-${frame}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 97} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#ns-grain-${frame})`} />
        </svg>
      ) : null}
      {bar > 0 ? (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: bar, background: '#000' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: bar, background: '#000' }} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
