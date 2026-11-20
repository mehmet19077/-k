import type React from 'react';
import { z } from 'zod';
import { EditorialScene, editorialSchema } from './EditorialScene';
import { HookScene, hookSchema } from './HookScene';
import { ImpactScene, impactSchema } from './ImpactScene';
import { ListScene, listSchema } from './ListScene';
import { MovementScene, movementSchema } from './MovementScene';
import { OutroScene, outroSchema } from './OutroScene';
import { PhotoScene, photoSchema } from './PhotoScene';
import { StatementScene, statementSchema } from './StatementScene';

/** Every scene type the engine can place in a film. Add a scene here and it is available to all films. */
export const sceneSchema = z.discriminatedUnion('type', [
  hookSchema,
  movementSchema,
  editorialSchema,
  impactSchema,
  statementSchema,
  outroSchema,
  listSchema,
  photoSchema,
]);
export type SceneSpec = z.infer<typeof sceneSchema>;
export type SceneType = SceneSpec['type'];

type AnyScene = React.FC<never>;
export const SCENES: Record<SceneType, AnyScene> = {
  hook: HookScene as AnyScene,
  movement: MovementScene as AnyScene,
  editorial: EditorialScene as AnyScene,
  impact: ImpactScene as AnyScene,
  statement: StatementScene as AnyScene,
  outro: OutroScene as AnyScene,
  list: ListScene as AnyScene,
  photo: PhotoScene as AnyScene,
};
