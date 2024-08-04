export interface UnknownAction {
  readonly type: string;
  readonly payload?: unknown;
}

export type Action<TType extends string, TPayload = undefined> = (
  { readonly type: TType } & (
    undefined extends TPayload
      ? { readonly payload?: TPayload }
      : { readonly payload: TPayload }
    )
);
