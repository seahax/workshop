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
