import type { StandardSchemaV1 } from '@standard-schema/spec';

export function createStandardSchema<TValue>(
  parse: (input: string[]) => Promise<StandardSchemaV1.Result<TValue>>,
): StandardSchemaV1.Props<string[], TValue> {
  return {
    version: 1,
    vendor: '@seahax/args',
    async validate(value) {
      return Array.isArray(value) && value.every((item) => typeof item === 'string')
        ? await parse(value)
        : { issues: [{ message: 'Expected an array of strings.' }] };
    },
  };
}
