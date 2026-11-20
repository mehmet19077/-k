import React, { createContext, useContext } from 'react';
import { AbsoluteFill } from 'remotion';
import { useScene } from '../scene/useScene';
import type { CameraState } from './camera';

type StageValue = { cam: CameraState; focus: number; dof: number };

const StageContext = createContext<StageValue>({
  cam: { x: 0, y: 0, zoom: 1, roll: 0 },
  focus: 1,
  dof: 0,
});

/**
 * A camera stage. Children are DepthLayers; each layer moves by the camera
 * scaled by its depth, which produces parallax and true-feeling depth
 * from flat layers. `dof` blurs layers by their distance from `focus`.
 */
export const Stage: React.FC<{
  cam: CameraState;
  focus?: number;
  dof?: number;
  children: React.ReactNode;
}> = ({ cam, focus = 1, dof = 0, children }) => (
  <StageContext.Provider value={{ cam, focus, dof }}>
    <AbsoluteFill style={{ overflow: 'hidden' }}>{children}</AbsoluteFill>
  </StageContext.Provider>
);

export const DepthLayer: React.FC<{
  z: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ z, children, style }) => {
  const { cam, focus, dof } = useContext(StageContext);
  const { unit } = useScene();
  const scale = 1 + (cam.zoom - 1) * z;
  const blur = dof * Math.abs(z - focus);
  return (
    <AbsoluteFill
      style={{
        transform: `translate3d(${-cam.x * z * unit}px, ${-cam.y * z * unit}px, 0) scale(${scale}) rotate(${cam.roll * z}deg)`,
        filter: blur > 0.2 ? `blur(${blur * unit}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
