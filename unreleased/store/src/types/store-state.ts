type DeepReadonly<TState> = TState extends (...args: any[]) => any ? TState : TState extends object ? {
  readonly [P in keyof TState]: DeepReadonly<TState[P]>
} : TState;

export type StoreState<TState extends object> = {
  readonly [P in keyof TState]: DeepReadonly<TState[P]>
};
