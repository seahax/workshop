export type Immutable<TValue> = TValue extends object ? {
  readonly [TKey in keyof TValue]: Immutable<TValue[TKey]>;
} : TValue;
