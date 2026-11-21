import React from 'react';
import { useLayout } from '../../engine/scene/layout';
import { Text } from '../../engine/type/Text';
import { color } from '../../engine/tokens';

/** Kicker + masked headline used over photographs and footage. */
export const Headline: React.FC<{ kicker?: string; title: string; at: number; exitAt: number; size?: number }> = ({
  kicker,
  title,
  at,
  exitAt,
  size = 112,
}) => {
  const { unit } = useLayout();
  return (
    <>
      {kicker ? (
        <>
          <Text text={kicker} size="kicker" weight={600} tracking="whisper" color={color.caustic} move="Rise" at={at - 0.25} exit={{ at: exitAt }} upper />
          <div style={{ height: 26 * unit }} />
        </>
      ) : null}
      <Text text={title} size={size} move="Reveal" split="words" stagger={0.12} at={at} exit={{ at: exitAt }} />
    </>
  );
};
