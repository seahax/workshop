import { createActions, type InferActionType } from '@seahax/store';

import type { Direction } from '../direction.ts';

export const actions = createActions({
  select: (entityId: string) => ({ entityId } as const),
  open: (entityId: string) => ({ entityId } as const),
  close: (entityId: string) => ({ entityId } as const),
  use: (entityId: string) => ({ entityId } as const),
  attach: (entityId: string, slot: string) => ({ entityId, slot } as const),
  take: (entityId: string) => ({ entityId } as const),
  go: (roomId: string) => ({ roomId } as const),
  look: (direction?: Direction) => ({ direction } as const),
  inspect: (entityId?: string) => ({ entityId } as const),
  cast: (entityId?: string, spell?: string) => ({ entityId, spell } as const),
});

export type Action = InferActionType<typeof actions>;
