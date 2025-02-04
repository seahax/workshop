export type UnionToIntersection<TUnion> = (
  TUnion extends unknown ? (distributedUnion: TUnion) => void : never
) extends ((mergedIntersection: infer Intersection) => void)
  ? Intersection & TUnion : never;

export type PickByType<TObject, TType> = {
  [TKey in keyof TObject as TObject[TKey] extends TType
    ? TKey
    : never
  ]: Extract<TObject[TKey], TType>;
};

type _OverloadUnion<TOverload, TPartialOverload = unknown> = TPartialOverload & TOverload extends (
  ...args: infer TArgs
) => infer TReturn
  // Prevent infinite recursion by stopping recursion when TPartialOverload
  // has accumulated all of the TOverload signatures.
  ? TPartialOverload extends TOverload
    ? never
    :
        | _OverloadUnion<TOverload, Pick<TOverload, keyof TOverload> & TPartialOverload & ((...args: TArgs) => TReturn)>
        | ((...args: TArgs) => TReturn)
  : never;

export type OverloadUnion<TOverload extends (...args: any[]) => any> = Exclude<
  _OverloadUnion<
    // The "() => never" signature must be hoisted to the "front" of the
    // intersection, for two reasons: a) because recursion stops when it is
    // encountered, and b) it seems to prevent the collapse of subsequent
    // "compatible" signatures (eg. "() => void" into "(a?: 1) => void"),
    // which gives a direct conversion to a union.
    (() => never) & TOverload
  >,
  TOverload extends () => never ? never : () => never
>;
