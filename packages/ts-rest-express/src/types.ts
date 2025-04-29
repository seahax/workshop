export type WithDefault<A, B> = unknown extends A ? B : A;

export type SmartPartial<T extends object> = Simplify<
{ [K in KeyOfByType<T, undefined>]?: T[K] } &
{ [K in Exclude<keyof T, KeyOfByType<T, undefined>>]: T[K] }
>;

type Simplify<T> = T extends object ? { [K in keyof T]: T[K] } : T;
type KeyOfByType<T extends object, U> = { [K in keyof T]: U extends T[K] ? K : never }[keyof T];
