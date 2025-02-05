import { type StoreGet } from './store-get.ts';
import { type StoreSet } from './store-set.ts';

export type StoreInit<TState extends object> = (set: StoreSet<TState>, get: StoreGet<TState>) => TState;
