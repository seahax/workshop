import type { Action } from './action.ts';

export type Reducer<TState, TAction extends Action<string, unknown>> = (state: TState, action: TAction) => TState;
