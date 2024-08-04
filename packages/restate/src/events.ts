import { type UnknownAction } from './action.js';

export interface Events<TAction extends UnknownAction, TState extends object> {
  dispatch: (action: TAction) => void;
  reduce: (state: TState, previousState: TState, action: TAction) => void;
  error: (error: unknown) => void;
}
