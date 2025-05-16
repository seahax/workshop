import type { StandardSchemaV1 } from '@standard-schema/spec';

export type Schema<TOutput = unknown, TInput = unknown> = StandardSchemaV1<TInput, TOutput>;
export type SchemaValidate<TValue> = Schema<TValue>['~standard']['validate'];
export type SchemaLike<TOutput = unknown, TInput = unknown> = Schema<TOutput, TInput> | SchemaValidate<TOutput>;

export type InferSchemaType<TSchema> = TSchema extends Schema<infer TValue> | SchemaValidate<infer TValue>
  ? TValue
  : never;

export type SchemaIssue = StandardSchemaV1.Issue;

export type SchemaResult<TValue = unknown> =
  | StandardSchemaV1.SuccessResult<TValue>
  | StandardSchemaV1.FailureResult & { readonly value?: undefined };

export interface SchemaOptions<TOptional extends boolean> {
  /**
   * If an `undefined` or `null` input is provided, validation will succeed
   * with an `undefined` value.
   */
  readonly optional?: TOptional;

  /**
   * Custom issue message to use when validation fails.
   */
  readonly message?: string;
}

function defaultMessage(ctx: { type: string; optional: boolean }): string {
  return `Expected a ${ctx.type}${ctx.optional ? ' or undefined' : ''} value`;
}

function createSchemaEnvelop<TValue>(
  validate: (value: unknown) => SchemaResult<TValue> | Promise<SchemaResult<TValue>>,
): Schema<TValue> {
  return { '~standard': { version: 1, vendor: '@seahax/args', validate } };
}

/**
 * Create a standard schema.
 */
function createSchema<TValue>(
  validate: (value: unknown, ctx: { optional: boolean }) => StandardSchemaV1.SuccessResult<TValue> | string,
): <TOptional extends boolean = false>(
    options?: SchemaOptions<TOptional>
  ) => Schema<TValue | (TOptional extends true ? undefined : never)> {
  return ({ optional = false, message } = {}) => {
    return createSchemaEnvelop((value) => {
      if (value == null && optional) return { value: undefined as TValue };
      const result = validate(value, { optional });
      if (typeof result === 'string') return { issues: [{ message: message ?? result }] };
      return result;
    });
  };
}

/**
 * Use a standard schema to validate (aka: parse) a value. The schema can also
 * be just the validate function a schema, instead of the full schema object.
 */
export async function validate<TValue>(
  schema: Schema<TValue> | SchemaValidate<TValue>,
  value: unknown,
): Promise<SchemaResult<TValue>> {
  return typeof schema === 'function'
    ? schema(value)
    : await schema['~standard'].validate(value);
}

/**
 * Simple string Standard Schema.
 */
export const string = createSchema((value, { optional }) => {
  return typeof value === 'string'
    ? { value }
    : defaultMessage({ type: 'string', optional });
});

/**
 * Simple number Standard Schema that will also coerce numeric strings using
 * the `Number` constructor.
 */
export const number = createSchema((value, { optional }) => {
  if (typeof value === 'number') return { value };
  if (typeof value === 'string') {
    const coerced = Number(value);
    if (!Number.isNaN(coerced)) return { value: coerced };
  }

  return defaultMessage({ type: 'number-like', optional });
});

/**
 * Simple BigInt Standard Schema that will also accept values that can be
 * passed to the `BigInt` constructor.
 */
export const bigint = createSchema((value, { optional }) => {
  if (typeof value === 'bigint') return { value };
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    try {
      const parsed = BigInt(value);
      return { value: parsed };
    }
    catch {}
  }

  return defaultMessage({ type: 'BigInt-like', optional });
});

/**
 * Simple regular expression Standard Schema that will also accept a string
 * value that can be parsed as a regular expression using the `RegExp`
 * constructor.
 */
export const regexp = createSchema((value, { optional }) => {
  if (value instanceof RegExp) return { value };
  if (typeof value === 'string') {
    try {
      return { value: new RegExp(value) };
    }
    catch {}
  }

  return defaultMessage({ type: 'RegExp-like', optional });
});

/**
 * Validate any of the provided schemas. The order of the schemas matters, as
 * the first schema that successfully validates the value will be used.
 */
export const anyOf = <const TSchemas extends SchemaLike[], TOptional extends boolean = false>(
  schemas: TSchemas,
  { optional = false as TOptional, message }: SchemaOptions<TOptional> = {},
): Schema<InferSchemaType<TSchemas[number]> | (TOptional extends true ? undefined : never)> => {
  return createSchemaEnvelop(async (value) => {
    if (value == null && optional) return { value: undefined as InferSchemaType<TSchemas[number]> };

    const issues: SchemaIssue[] = [];

    for (const schema of schemas) {
      const result = await validate(schema, undefined);

      if (result.issues) {
        issues.push(...result.issues);
      }
      else {
        return result as StandardSchemaV1.SuccessResult<InferSchemaType<TSchemas[number]>>;
      }
    }

    return { issues: message == null ? issues : [{ message }] };
  });
};
