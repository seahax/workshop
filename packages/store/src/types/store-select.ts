import { type StoreState } from './store-state.js';

export type StoreSelect<TState extends object, TValue> = (state: StoreState<TState>) => TValue;
