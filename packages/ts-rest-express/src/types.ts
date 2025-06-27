type Simplify<T> = T extends object ? { [K in keyof T]: T[K] } : T;

export type WithDefault<A, B> = unknown extends A ? B : A;

export type SmartPartial<T extends object> = Simplify<{
  [K in keyof T as undefined extends T[K] ? K : never]+?: T[K]
} & {
  [K in keyof T as undefined extends T[K] ? never : K]-?: T[K]
}>;
