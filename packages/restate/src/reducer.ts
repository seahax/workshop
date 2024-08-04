import { type UnknownAction } from './action.js';

export type Reducer<TAction extends UnknownAction, TState extends object> = (
  action: TAction,
  state: TState
) => TState;
