import { type StoreState } from './store-state.js';

export type StoreGet<TState extends object> = () => StoreState<TState>;
