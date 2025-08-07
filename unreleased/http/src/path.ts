type PathParameterNames<TPathTemplate> = (
  TPathTemplate extends `${string}{${infer TName}}${infer TRest}`
    ? (TName extends `${infer TName0}+` ? TName0 : TName) | PathParameterNames<TRest>
    : never
);

/**
 * Infer the path parameters type from a path template.
 */
export type PathParameters<TPathTemplate> = any extends any ? (
  TPathTemplate extends [infer TFirst, ...infer TRest]
    ? PathParameters<TFirst> | PathParameters<TRest>
    : { readonly [K in PathParameterNames<TPathTemplate>]: string; }
) : never;

export interface PathParameterToken {
  readonly key: PathParameterKey;
  readonly parameterName: string;
}

export const PathParameterKey = {
  SingleSegment: 1,
  MultiSegment: 2,
} as const;
export type PathParameterKey = typeof PathParameterKey[keyof typeof PathParameterKey];

/**
 * Parse a path into tokens. Path separators and literal segments are returned
 * as strings. If the `parsePathSegment` function can be used to transform some
 * path segments into complex tokens (eg. parameters).
 */
export function parsePath<TSegmentToken = never>(
  path: string,
  parsePathSegment: (token: string) => string | TSegmentToken = (token) => token,
): (string | TSegmentToken)[] {
  const tokens: (string | TSegmentToken)[] = [];
  const normalPath = path.startsWith('/') ? path : `/${path}`;

  let segment = '';

  for (const char of normalPath.split('')) {
    if (char === '/') {
      // The character is a path separator.

      if (segment) {
        // Yield and clear the accumulated non-empty path segment.
        tokens.push(parsePathSegment(segment));
        segment = '';
      }

      // Also yield the path separator itself.
      tokens.push(char);
      continue;
    }

    // The character is not a path separator. Accumulate it as part of the
    // current path segment.
    segment += char;
  }

  if (segment) {
    // Yield the last non-empty path segment, which happens if the path does
    // not end with a path separator.
    tokens.push(parsePathSegment(segment));
  }

  if (tokens[0] !== '/') {
    // Ensure the path starts with a leading slash.
    tokens.unshift('/');
  }

  return tokens;
}

/**
 * Parse a path segment into a literal string or a parameter token.
 */
export function parsePathSegment(
  token: string,
  onError: (error: 'invalid_parameter' | 'invalid_literal') => never,
): string | PathParameterToken {
  if (token.startsWith('{') && token.endsWith('}')) {
    const label = token.slice(1, -1);

    if (label.includes('/') || label.includes('{') || label.includes('}')) {
      // The parameter label contains a path separator or a curly brace, which
      // probably indicates a typo.
      return onError('invalid_parameter');
    }

    // Tokens that are wrapped in curly braces are path parameters.
    return label.endsWith('+')
      // Multi-segment (wildcard).
      ? { key: PathParameterKey.MultiSegment, parameterName: label.slice(0, -1) }
      // Single segment.
      : { key: PathParameterKey.SingleSegment, parameterName: label };
  }

  if (token.includes('{') || token.includes('}')) {
    // The literal contains a curly brace, which probably indicates a typo.
    return onError('invalid_literal');
  }

  // A literal path segment (not a parameter).
  return token;
}
