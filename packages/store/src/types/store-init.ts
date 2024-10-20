import { type StoreGet } from './store-get.js';
import { type StoreSet } from './store-set.js';

export type StoreInit<TState extends object> = (set: StoreSet<TState>, get: StoreGet<TState>) => TState;
