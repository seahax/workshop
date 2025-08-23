import {
  parsePath,
  parsePathTemplate,
  PathParameterMultiSegment,
  PathParameterSingleSegment,
  type PathParameterToken,
} from './path.ts';

interface Node<TValue> {
  readonly key: string | typeof PathParameterSingleSegment | typeof PathParameterMultiSegment;
  readonly children: Map<string | typeof PathParameterSingleSegment | typeof PathParameterMultiSegment, Node<TValue>>;
  readonly methods: Map<string, {
    readonly value: TValue;
    readonly parameterNames: readonly string[];
  }>;
}

/**
 * A collection of routes for handling HTTP requests.
 */
export interface Router<TValue> {
  /**
   * Add a route.
   *
   * The single most specific route that matches a request is applied. If no
   * route matches and no fallbacks have been added, then no filters will be
   * invoked and a 404 response will be sent.
   */
  addRoute(method: string, pathTemplate: string, value: TValue): void;

  /**
   * Get the route that matches the HTTP method and path.
   */
  match(method: string, path: string): RouterResult<TValue>;
}

/**
 * Result of resolving a route for an HTTP method and path.
 *
 * The result type may be on of the following:
 * - `found`: A route was found that matches the method and path.
 * - `not-found`: No route was found that matches the method and path.
 * - `path-found`: No route was found that matches the method and path, but
 *   there are other routes that match just the path.
 */
export type RouterResult<TValue> = {
  readonly type: 'found';
  readonly value: TValue;
  readonly pathParameters: Readonly<Record<string, string>>;
} | {
  readonly type: 'not-found' | 'path-found';
  readonly value?: undefined;
  readonly pathParameters?: undefined;
};

/**
 * A router is a collection of routes which can be matched against HTTP methods
 * and paths.
 *
 * Behavior:
 * - Path leading slashes are added if missing.
 * - Implemented as a path-wise radix trie.
 * - Duplicate routes overwrite previous routes.
 * - Routes that only differ by parameter names are considered duplicates.
 * - Single segment parameters must match an entire segment.
 * - A multi-segment parameter must be the last segment in the path.
 * - Parameters are always required, and cannot match an empty string,
 * - The most specific route is returned when multiple routes match a path.
 */
export function createRouter<TValue>(): Router<TValue> {
  const root = createNode<TValue>('');
  const self: Router<TValue> = {
    addRoute(method, pathTemplate, value) {
      const tokens = parsePathTemplate(pathTemplate);
      addRecursive(value, tokens, method.toUpperCase(), root, []);
    },
    match(method, path) {
      const tokens = parsePath(path);
      const result = findRecursive(tokens, method, root, []);
      return result;
    },
  };

  return self;
}

/**
 * Recursively add a route to the router's radix trie.
 */
function addRecursive<TValue>(
  value: TValue,
  [token, ...tokens]: readonly (string | PathParameterToken)[],
  method: string,
  currentNode: Node<TValue>,
  parameterNames: readonly string[],
): void {
  if (token == null) {
    // No more tokens. Therefore, the current node is the terminal node of the
    // route path template.
    currentNode.methods.set(method, { value, parameterNames });
    return;
  }

  const { key, parameterName } = typeof token === 'string' ? { key: token } : token;
  const [nextNode, isNewNode] = (() => {
    const nextNode = currentNode.children.get(key);
    return nextNode ? [nextNode, false] : [createNode<TValue>(key), true];
  })();

  const nextParameterName = typeof key === 'string'
    ? parameterNames
    : [...parameterNames, parameterName];

  addRecursive(value, tokens, method, nextNode, nextParameterName);

  // Commit delayed change when we know there are no conflicts.
  if (isNewNode) {
    currentNode.children.set(key, nextNode);
  }
}

/**
 * Recursively find a route in the router's radix trie.
 */
function findRecursive<TValue>(
  [token, ...tokens]: readonly string[],
  method: string,
  currentNode: Node<TValue>,
  parameterValues: readonly string[],
): RouterResult<TValue> {
  if (token == null) {
    // No more tokens. Therefore, the search path matches at least the
    // beginning of a route path.

    if (currentNode.methods.size === 0) {
      // The current node is not a route terminal node. Therefore, no route
      // path is fully matched.
      return { type: 'not-found' };
    }

    const entry = currentNode.methods.get(method);

    if (!entry) {
      // The current node is a route terminal node, but the method does not
      // match any of the routes.
      return { type: 'path-found' };
    }

    const { value, parameterNames } = entry;
    const pathParameters: Record<string, string> = {};

    // Combine the collected array of parameter values with the route
    // parameter names to create a record of path parameters.
    for (const [i, parameterValue] of parameterValues.entries()) {
      pathParameters[parameterNames[i]!] = decodeURIComponent(parameterValue);
    }

    return { type: 'found', value, pathParameters };
  }

  if (currentNode.children.size === 0) {
    // No children. Therefore, the route path is not found.
    return { type: 'not-found' };
  }

  let isPathFound = false;

  // Try segment keys from most specific to least specific.
  // 1. Literally match the token.
  // 2. Match a single segment parameter.
  // 3. Match all remaining tokens as a multi-segment parameter.
  for (const key of [token, PathParameterSingleSegment, PathParameterMultiSegment] as const) {
    const nextNode = currentNode.children.get(key);

    if (!nextNode) {
      // No match. Try the next key that could match the token.
      continue;
    }

    const { nextParameterValues, nextTokens } = (() => {
      if (key === PathParameterSingleSegment) {
        // Matched a single parameter.
        return {
          // Append the token as a parameter value for the next recursion.
          nextParameterValues: [...parameterValues, token],
          // The next recursion should continue with the remaining tokens.
          nextTokens: tokens,
        };
      }

      if (key === PathParameterMultiSegment) {
        // Matched a multi-segment parameter.
        return {
          // Concatenate the current token and all remaining tokens, and add
          // the string as the last parameter value.
          nextParameterValues: [...parameterValues, [token, ...tokens].join('')],
          // The next recursion should be the final one, because all the
          // remaining tokens have been consumed.
          nextTokens: [],
        };
      }

      // Matched a literal path segment.
      return {
        // The next parameter values are the same as the current ones
        nextParameterValues: parameterValues,
        // The next recursion should continue with the remaining tokens.
        nextTokens: tokens,
      };
    })();

    const childMatch = findRecursive(nextTokens, method, nextNode, nextParameterValues);

    if (childMatch.type === 'found') {
      // A route was found. Return it.
      return childMatch;
    }

    isPathFound ||= childMatch.type === 'path-found';
  }

  return { type: isPathFound ? 'path-found' : 'not-found' };
}

/**
 * Create a new node for the radix trie.
 */
function createNode<TValue>(
  key: string | typeof PathParameterSingleSegment | typeof PathParameterMultiSegment,
): Node<TValue> {
  return { key, children: new Map(), methods: new Map() };
}
