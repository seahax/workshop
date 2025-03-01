export interface Action<TType extends string, TPayload> {
  readonly type: TType;
  readonly payload: TPayload;
}

export type Actions<TActions> = TActions extends object ? {
  [TType in keyof TActions as (
    TType extends string
      ? TActions[TType] extends (...args: any[]) => any
        ? TType
        : never : never
  )]: TType extends string
    ? TActions[TType] extends (...args: any[]) => any
      ? (...args: Parameters<TActions[TType]>) => Action<TType, ReturnType<TActions[TType]>>
      : never : never;
} : never;

export type InferActionType<TAction> = TAction extends (...args: any[]) => infer TReturn
  ? TReturn extends Action<string, unknown>
    ? TReturn
    : never
  : TAction extends object
    ? { [TType in keyof TAction]: InferActionType<TAction[TType]> }[keyof TAction]
    : never;

export function createActions<TActions extends object>(actions: TActions): Actions<TActions> {
  return Object.entries(actions).flatMap(([type, getPayload]) => {
    return typeof getPayload === 'function'
      ? [{ [type]: (...args: any[]) => ({ type, payload: getPayload(...args) }) }]
      : [];
  }) as Actions<TActions>;
}
