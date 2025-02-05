import { type StoreState } from './store-state.ts';

export type StoreSelect<TState extends object, TValue> = (state: StoreState<TState>) => TValue;
