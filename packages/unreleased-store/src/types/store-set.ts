import { type StoreState } from './store-state.js';

export type StoreSet<TState extends object> = (
  factory: (state: StoreState<TState>
  ) => Partial<StoreState<TState>>) => void;
