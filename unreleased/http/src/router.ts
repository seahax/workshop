import { parsePath, parsePathSegment, PathParameterKey, type PathParameterToken } from './path.ts';
import { memo } from './utils/memo.ts';

interface Node<TRoute extends RouteRequired> {
  readonly key: string | PathParameterKey;
  readonly children: Map<string | PathParameterKey, Node<TRoute>>;
  readonly methods: Map<string, MethodValue<TRoute>>;
}

interface MethodValue<TRoute extends RouteRequired> {
  readonly route: TRoute;
  readonly parameterNames: readonly string[];
}

interface RouteRequired {
  readonly pathTemplates: readonly string[];
  readonly method: string;
}

/**
 * Collection of routes which can be matched against HTTP methods and paths.
 */
export interface Router<TRoute extends RouteRequired> {
  /**
   * Add a route.
   */
  add(route: TRoute): this;

  /**
   * Get the route that matches the HTTP method and path.
   *
   * NOTE: The method and path arguments accept `undefined` values, because
   * Node's `IncomingMessage` allows `undefined` for both properties. If either
   * one is not defined, then the router will just return a "not found" result
   * immediately.
   */
  match(method: string | undefined, path: string | undefined): RouterResult<TRoute>;
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
export type RouterResult<TRoute extends RouteRequired> = {
  readonly type: 'found';
  readonly route: TRoute;
  readonly pathParameters: Readonly<Record<string, string>>;
} | {
  readonly type: 'not-found' | 'path-found';
  readonly route?: undefined;
  readonly pathParameters?: undefined;
};

/**
 * A router is a collection of routes which can be matched against HTTP methods
 * and paths.
 *
 * Behavior:
 * - Path leading slashes are added if missing.
 * - Implemented as a path-wise radix trie.
 * - Duplicate routes are not allowed.
 * - Routes that only differ by parameter names are considered duplicates.
 * - Adding the same route twice is a no-op (not a duplicate).
 * - Single segment parameters must match an entire segment.
 * - A multi-segment parameter must be the last segment in the path.
 * - Parameters are always required, and cannot match an empty string,
 * - The most specific route is returned when multiple routes match a path.
 */
export function createRouter<TRoute extends RouteRequired>(): Router<TRoute> {
  const root = createNode<TRoute>('');
  const self: Router<TRoute> = {
    add(route) {
      route.pathTemplates.forEach((pathTemplate) => {
        const tokens = parsePath(pathTemplate, (segment) => parsePathSegment(segment, (error) => {
          switch (error) {
            case 'invalid_parameter': { throw new Error(
              `Route path template "${pathTemplate}" is invalid (reserved character in parameter name)`,
            ); }
            case 'invalid_literal': { throw new Error(
              `Route path template "${pathTemplate}" is invalid (reserved character in literal segment)`,
            ); }
          }
        }));

        const method = route.method.toUpperCase();

        addRecursive(route, tokens, method, root, [], (error) => {
          switch (error.type) {
            case 'duplicate_route': { throw new Error(
              `Route "${error.method}${pathTemplate}" is a duplicate`,
            ); }
            case 'duplicate_param': { throw new Error(
              `Route path template "${pathTemplate}" is invalid (duplicate parameter)`,
            ); }
            case 'invalid_multi_segment': { throw new Error(
              `Route path template "${pathTemplate}" is invalid (multi-segment parameter is not last)`,
            ); }
          }
        });
      });

      return self;
    },
    match(method, path) {
      if (method == null || path == null) {
        return { type: 'not-found' };
      }

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
function addRecursive<TRoute extends RouteRequired>(
  route: TRoute,
  [token, ...tokens]: readonly (string | PathParameterToken)[],
  method: string,
  currentNode: Node<TRoute>,
  parameterNames: readonly string[],
  onError: (error: (
    | { type: 'duplicate_route'; method: string }
    | { type: 'duplicate_param' | 'invalid_multi_segment' }
  )) => never,
): void {
  if (token == null) {
    // No more tokens. Therefore, the current node is the terminal node of the
    // route path template.

    const existingRoute = currentNode.methods.get(method)?.route;

    if (existingRoute && existingRoute !== route) {
      return onError({ type: 'duplicate_route', method });
    }

    // The route is not a duplicate. Add it and its associated parameter names
    // to the current node.
    currentNode.methods.set(method, { route, parameterNames: parameterNames });
    return;
  }

  if (currentNode.key === PathParameterKey.MultiSegment) {
    return onError({ type: 'invalid_multi_segment' });
  }

  const { key, parameterName } = typeof token === 'string' ? { key: token } : token;
  const [nextNode, isNewNode] = (() => {
    const nextNode = currentNode.children.get(key);
    return nextNode ? [nextNode, false] : [createNode<TRoute>(key), true];
  })();

  if (typeof key !== 'string' && parameterNames.includes(parameterName)) {
    return onError({ type: 'duplicate_param' });
  }

  const nextParameterName = typeof key === 'string'
    ? parameterNames
    : [...parameterNames, parameterName];

  addRecursive(route, tokens, method, nextNode, nextParameterName, onError);

  // Commit delayed change when we know there are no conflicts.
  if (isNewNode) {
    currentNode.children.set(key, nextNode);
  }
}

/**
 * Recursively find a route in the router's radix trie.
 */
function findRecursive<TRoute extends RouteRequired>(
  [token, ...tokens]: readonly string[],
  method: string,
  currentNode: Node<TRoute>,
  parameterValues: readonly string[],
): RouterResult<TRoute> {
  if (token == null) {
    // No more tokens. Therefore, the search path matches at least the
    // beginning of a route path.

    if (currentNode.methods.size === 0) {
      // The current node is not a route terminal node. Therefore, no route
      // path is fully matched.
      return { type: 'not-found' };
    }

    const value = currentNode.methods.get(method);

    if (!value) {
      // The current node is a route terminal node, but the method does not
      // match any of the routes.
      return { type: 'path-found' };
    }

    const { route, parameterNames } = value;
    const getPathParameters = memo(() => {
      const pathParameters: Record<string, string> = {};

      // Combine the collected array of parameter values with the route
      // parameter names to create a record of path parameters.
      for (const [i, parameterValue] of parameterValues.entries()) {
        pathParameters[parameterNames[i]!] = parameterValue;
      }

      return pathParameters;
    });

    return {
      type: 'found',
      route,
      get pathParameters() {
        return getPathParameters();
      },
    };
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
  for (const key of [token, PathParameterKey.SingleSegment, PathParameterKey.MultiSegment]) {
    const nextNode = currentNode.children.get(key);

    if (!nextNode) {
      // No match. Try the next key that could match the token.
      continue;
    }

    const { nextParameterValues, nextTokens } = (() => {
      if (key === PathParameterKey.SingleSegment) {
        // Matched a single parameter.
        return {
          // Append the token as a parameter value for the next recursion.
          nextParameterValues: [...parameterValues, token],
          // The next recursion should continue with the remaining tokens.
          nextTokens: tokens,
        };
      }

      if (key === PathParameterKey.MultiSegment) {
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
function createNode<TRoute extends RouteRequired>(key: string | PathParameterKey): Node<TRoute> {
  return { key, children: new Map(), methods: new Map() };
}
