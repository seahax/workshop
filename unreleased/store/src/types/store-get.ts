import { type StoreState } from './store-state.ts';

export type StoreGet<TState extends object> = () => StoreState<TState>;
