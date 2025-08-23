import type { StandardSchemaV1 } from '@standard-schema/spec';

import { RequestValidationError } from '../error/request-validation-error.ts';

export async function validate<TOutput>(
  schema: StandardSchemaV1<unknown, TOutput> | undefined,
  value: unknown,
  pathPrefix?: string,
): Promise<TOutput> {
  let result: StandardSchemaV1.Result<TOutput>;

  // In-case value is a promise.
  value = await value;

  try {
    if (!schema) {
      return value as TOutput;
    }

    result = await schema['~standard'].validate(value);
  }
  catch (error) {
    if (error instanceof RequestValidationError) {
      throw error;
    }

    throw new RequestValidationError([{
      message: 'Unexpected error thrown while validating request data',
      path: pathPrefix ? [pathPrefix] : [],
    }], { cause: error });
  }

  if (result.issues) {
    throw new RequestValidationError(result.issues.map((issue) => ({
      ...issue,
      path: [...(pathPrefix ? [pathPrefix] : []), ...(issue.path || [])],
    })));
  }

  return result.value;
}
