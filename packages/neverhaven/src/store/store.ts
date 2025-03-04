import { createStoreFactory } from '@seahax/store';

import type { Action } from './action.ts';
import { characterMove } from './reducers/character-move.ts';
import { type State } from './state.ts';

export type Store = ReturnType<typeof createStore>;

export const createStore = createStoreFactory<State, Action>(
  () => ({
    entities: {},
  }),
  [
    characterMove,
  ],
);
