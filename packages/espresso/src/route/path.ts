type KeyOf<T> = T extends object ? keyof T : never;
type SimplifyObjectUnion<T extends object> = any extends any ? {
  readonly [K in Extract<KeyOf<T>, keyof T>]: T[K];
} & {
  readonly [K in Exclude<KeyOf<T>, keyof T>]?: Extract<T, { readonly [P in K]: any }>[K];
} : never;

type PathParameterNames<TPathTemplate> = (
  TPathTemplate extends `${string}{${infer TName}}${infer TRest}`
    ? (TName extends `${infer TName0}+` ? TName0 : TName) | PathParameterNames<TRest>
    : never
);

type PathParameterUnion<TPathTemplate> = any extends any ? (
  TPathTemplate extends [infer TFirst, ...infer TRest]
    ? PathParameterUnion<TFirst> | PathParameterUnion<TRest>
    : { readonly [K in PathParameterNames<TPathTemplate>]: string; }
) : never;

/**
 * Infer the path parameters type from a path template.
 */
export type PathParameters<TPathTemplate> = SimplifyObjectUnion<PathParameterUnion<TPathTemplate>>;

export const PathParameterSingleSegment = Symbol('PathParameterSingleSegment');
export const PathParameterMultiSegment = Symbol('PathParameterMultiSegment');
export interface PathParameterToken {
  readonly key: typeof PathParameterSingleSegment | typeof PathParameterMultiSegment;
  readonly parameterName: string;
}

/**
 * Parse a path into separators and segments (strings).
 */
export function parsePath(path: string): string[] {
  const tokens: string[] = [];
  const normalPath = path.startsWith('/') ? path : `/${path}`;
  let segment = '';

  for (const char of normalPath.split('')) {
    if (char === '/') {
      if (segment) {
        tokens.push(segment);
        segment = '';
      }

      tokens.push(char);
      continue;
    }

    // The character is not a path separator. Accumulate it as part of the
    // current path segment.
    segment += char;
  }

  if (segment) {
    tokens.push(segment);
  }

  if (tokens[0] !== '/') {
    // Ensure the path starts with a leading slash.
    tokens.unshift('/');
  }

  return tokens;
}

/**
 * Parse a path template into separators, literal segments, and parameter
 * tokens.
 */
export function parsePathTemplate(pathTemplate: string): (string | PathParameterToken)[] {
  const pathTokens = parsePath(pathTemplate);
  const tokens: (string | PathParameterToken)[] = [];
  let hasMultiSegmentParameter = false;

  for (const pathToken of pathTokens) {
    if (hasMultiSegmentParameter) {
      throw new Error(`Path template "${pathTemplate}" contains a multi-segment (wildcard) parameter that is not last`);
    }

    if (pathToken === '/') {
      tokens.push(pathToken);
      continue;
    }

    const token = parseParameterToken(pathToken);
    tokens.push(token);
    hasMultiSegmentParameter = typeof token === 'object' && token.key === PathParameterMultiSegment;
  }

  return tokens;
}

function parseParameterToken(
  token: string,
  // onError: (error: 'invalid_parameter' | 'invalid_literal') => never,
): string | PathParameterToken {
  if (token.startsWith('{') && token.endsWith('}')) {
    const name = token.slice(1, -1);

    if (name.includes('/') || name.includes('{') || name.includes('}')) {
      // The parameter name contains a path separator or a curly brace, which
      // probably indicates a typo.
      throw new Error(`Path parameter name "${name}" contains invalid characters`);
    }

    // Tokens that are wrapped in curly braces are path parameters.
    return name.endsWith('+')
      // Multi-segment (wildcard).
      ? { key: PathParameterMultiSegment, parameterName: name.slice(0, -1) }
      // Single segment.
      : { key: PathParameterSingleSegment, parameterName: name };
  }

  if (token.includes('{') || token.includes('}')) {
    // The literal contains a curly brace, which probably indicates a typo.
    throw new Error(`Path literal segment "${token}" contains invalid characters`);
  }

  // A literal path segment (not a parameter).
  return token;
}
