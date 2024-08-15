import { Evented } from '@seahax/evented';

import { type UnknownAction } from './action.js';
import { type Events } from './events.js';
import { type Reducer } from './reducer.js';
import { type Thunk } from './thunk.js';

export class Store<TAction extends UnknownAction, TState extends object> extends Evented<Events<TAction, TState>> {
  private _state: TState;
  private _reducer: Reducer<TAction, TState>;

  get state(): TState {
    return this._state;
  }

  constructor(initialState: TState, reducer: Reducer<TAction, TState>) {
    super();
    this._state = initialState;
    this._reducer = reducer;
  }

  dispatch(action: TAction | Thunk<TAction, TState>): void {
    if (typeof action === 'function') {
      action((action) => this.dispatch(action), () => this.state).catch((error: unknown) => {
        if (!this.emit('error', error)) {
          throw error;
        }
      });

      return;
    }

    const previousState = this._state;

    this.emit('dispatch', action);
    this._state = this._reducer(action, this._state);
    this.emit('reduce', this._state, previousState, action);
  }
}
