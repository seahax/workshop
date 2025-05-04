import { type StandardSchemaV1 } from '@standard-schema/spec';
import { z } from 'zod';

type Simplify<T> = T extends object ? {
  [K in keyof T]: T[K];
} : T;

type SmartPartial<T> = T extends object ? Simplify<{
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: T[K] | undefined;
}> : never;

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type Status = `${2 | 3 | 4 | 5}${Digit}${Digit}`;
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type Path = `/${string}`;

type Headers = Readonly<Record<string, string | string[]>>;
type RequestCookies = Readonly<Record<string, string>>;
type RequestParams = Readonly<Record<string, string>>;

export interface ResponseCookieConfig {
  readonly value: string;
  readonly domain?: string;
  readonly path?: string;
  readonly secure?: boolean;
  readonly httpOnly?: boolean;
  readonly sameSite?: 'Strict' | 'Lax' | 'None';
  readonly expires?: Date;
  readonly maxAge?: number;
}
export type ResponseCookies = Readonly<Record<string, string | ResponseCookieConfig>>;

export type ServerResponse<
  TStatus extends Status = Status,
  THeaders extends Headers = Headers,
  TBody = unknown,
> = SmartPartial<{
  readonly status: TStatus;
  readonly headers?: THeaders;
  readonly cookies?: ResponseCookies;
  readonly body: TBody;
}>;

export interface RouteResponsesConfig {
  readonly headers?: StandardSchemaV1<Headers>;
  readonly cookies?: StandardSchemaV1<ResponseCookies>;
  readonly body?: StandardSchemaV1;
}

export interface RouteConfig {
  readonly method: Method;
  readonly path: Path;
  readonly params?: StandardSchemaV1<RequestParams>;
  readonly headers?: StandardSchemaV1<Headers>;
  readonly cookies?: StandardSchemaV1<RequestCookies>;
  readonly body?: StandardSchemaV1;
  readonly responses: {
    readonly [TStatus in Status]?: RouteResponsesConfig
  };
}

export type Config = Readonly<Record<string, RouteConfig>>;

export type InferStandardSchemaV1<TSchema> = TSchema extends StandardSchemaV1<infer TInput, infer TOutput>
  ? StandardSchemaV1<TInput, TOutput>
  : undefined;

export type InferPathParamsKeys<TPath> = TPath extends `${string}{${infer TParam}}${infer TRest}`
  ? TParam | InferPathParamsKeys<TRest>
  : never;

type InferParamsSchema<TParams, TPath> = InferPathParamsKeys<TPath> extends never
  ? undefined
  : TParams extends StandardSchemaV1<infer TInput extends Record<string, string>, infer TOutput>
    ? (StandardSchemaV1<
        Simplify<
          Pick<TInput, InferPathParamsKeys<TPath>>
          & Record<Exclude<keyof TInput, InferPathParamsKeys<TPath>>, never>
        >,
        TOutput
      >)
    : StandardSchemaV1<{ readonly [TParam in InferPathParamsKeys<TPath>]: string }>;

type InferResponsesConfig<TResponses> = Simplify<{
  readonly [TStatus in keyof TResponses]: (
    TResponses[TStatus] extends RouteResponsesConfig
      ? (SmartPartial<{
          readonly headers: InferStandardSchemaV1<TResponses[TStatus]['headers']>;
          readonly cookies: InferStandardSchemaV1<TResponses[TStatus]['cookies']>;
          readonly body: InferStandardSchemaV1<TResponses[TStatus]['body']>;
        }>)
      : RouteResponsesConfig
  )
}>;

type InferConfig<TConfig> = Simplify<{
  readonly [TKey in keyof TConfig]: (
    TConfig[TKey] extends RouteConfig
      ? (SmartPartial<{
          readonly method: TConfig[TKey]['method'];
          readonly path: TConfig[TKey]['path'];
          readonly params: InferParamsSchema<TConfig[TKey]['params'], TConfig[TKey]['path']>;
          readonly headers: InferStandardSchemaV1<(TConfig[TKey])['headers']>;
          readonly cookies: InferStandardSchemaV1<(TConfig[TKey])['cookies']>;
          readonly body: InferStandardSchemaV1<(TConfig[TKey])['body']>;
          readonly responses: InferResponsesConfig<(TConfig[TKey])['responses']>;
        }>)
      : RouteConfig
  );
}>;

export function defineApi<TConfig>(
  config: TConfig extends InferConfig<TConfig> ? TConfig : InferConfig<TConfig>,
): TConfig extends InferConfig<TConfig> ? InferConfig<TConfig> : unknown {
  return config as any;
}

export async function validate<TSchema extends StandardSchemaV1>(
  schema: TSchema,
  value: unknown,
): Promise<StandardSchemaV1.InferOutput<TSchema>> {
  const result = await schema['~standard'].validate(value);

  if (result.issues) {
    throw new Error('ts-api: Validation error');
  }

  return result.value;
}

const api = defineApi({
  foo: {
    method: 'POST',
    path: '/foo',
    // params: z.object({ test: z.string() }),
    // headers: z.object({ 'x-foo': z.string() }),
    // cookies: z.object({ SESSION: z.string().uuid() }),
    // body: z.object({ foo: z.number() }),
    responses: {
      200: { body: z.string() },
    },
  },
});
