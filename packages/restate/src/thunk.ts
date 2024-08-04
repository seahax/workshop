import { type UnknownAction } from './action.js';

export type Thunk<TAction extends UnknownAction, TState extends object> = (
  dispatch: (action: TAction) => void,
  getState: () => TState
) => Promise<void>;

export const createThunk = <TAction extends UnknownAction, TState extends object>(
  thunk: Thunk<TAction, TState>,
): Thunk<TAction, TState> => thunk;
