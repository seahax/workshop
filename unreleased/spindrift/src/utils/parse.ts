import { type z } from 'zod';

export function parse<T>(
  value: unknown,
  schema: Pick<z.ZodSchema<T>, 'safeParse'>,
  getError: (issues: readonly string[]) => string | Error = (issues) => issues.join('\n'),
): T {
  const result = schema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  const issues = result.error.issues.map((issue) => `${getPathString(issue.path)}: ${issue.message}`);
  const error = getError(issues);

  throw error instanceof Error ? error : new Error(error, result.error);
}

function getPathString(path: (string | number)[]): string {
  return '$' + path.map((part) => typeof part === 'string' ? `.${part}` : `[${part}]`).join('');
}
