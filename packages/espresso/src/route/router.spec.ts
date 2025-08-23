import { describe, expect, test, vi } from 'vitest';

import { createRoute, type Route } from './route.ts';
import { createRouter, type Router } from './router.ts';

describe('router', () => {
  ([
    '/foo/bar',
    '/foo/bar/',
  ] as const).forEach((path) => {
    describe(`literal route "GET ${path}"`, () => {
      function setup(): [Router<Route>, Route] {
        const router = createRouter<Route>();
        const route = createRoute('GET', path, vi.fn());
        addRoute(router, route);
        return [router, route];
      }

      test(`does match`, () => {
        const [router, value] = setup();
        const results = router.match('GET', path);
        expect(results).toStrictEqual({ type: 'found', value, pathParameters: {} });
      });

      ([
        ['GET', '/', 'not-found'],
        ['GET', '/foo', 'not-found'],
        ['GET', '/foo//bar', 'not-found'],
        ['GET', '/foo//bar/', 'not-found'],
        ['GET', '/foo/bar/baz', 'not-found'],
        ['GET', `${path}/`, 'not-found'],
        ['GET', `/${path}`, 'not-found'],
        ['POST', path, 'path-found'],
      ] as const).forEach(([method, path, type]) => {
        test(`does not match "${method} ${path}`, () => {
          const [router] = setup();
          expect(router.match(method, path)).toStrictEqual({ type });
        });
      });
    });
  });

  describe('parametric route "GET /foo/{foo}/bar/{bar}"', () => {
    function setup(): Router<Route> {
      const router = createRouter<Route>();
      const route = createRoute('GET', '/foo/{foo}/bar/{bar}', vi.fn());
      addRoute(router, route);
      return router;
    }

    ([
      ['/foo/a/bar/b', { foo: 'a', bar: 'b' }],
      ['/foo/123/bar/345', { foo: '123', bar: '345' }],
      ['/foo/:a/bar/:b', { foo: ':a', bar: ':b' }],
    ] as const).forEach(([path, pathParameters]) => {
      test(`does match "GET ${path}"`, () => {
        const router = setup();
        const results = router.match('GET', path);
        expect(results).toStrictEqual({ type: 'found', value: expect.anything(), pathParameters });
      });
    });

    ([
      ['GET', '/foo/a/bar', 'not-found'],
      ['GET', '/foo/a/bar/', 'not-found'],
      ['GET', '/foo//bar/b', 'not-found'],
      ['GET', '/foo/a/bar/b/baz', 'not-found'],
      ['POST', '/foo/a/bar/b', 'path-found'],
    ] as const).forEach(([method, path, type]) => {
      test(`does not match "${method} ${path}"`, () => {
        const router = setup();
        expect(router.match(method, path)).toStrictEqual({ type });
      });
    });
  });

  describe('multi-segment parameter route "GET /foo/{bar+}"', () => {
    function setup(): Router<Route> {
      const router = createRouter<Route>();
      const route = createRoute('GET', '/foo/{bar+}', vi.fn());
      addRoute(router, route);
      return router;
    }

    ([
      '/foo/a',
      '/foo/a/b',
      '/foo/a/b/',
      '/foo/abc/def',
      '/foo//',
    ] as const).forEach((path) => {
      test(`does match "GET ${path}"`, () => {
        const router = setup();
        const results = router.match('GET', path);
        expect(results).toStrictEqual({
          type: 'found',
          value: expect.anything(),
          pathParameters: { bar: path.replace(/^\/foo\//u, '') },
        });
      });
    });

    ([
      ['GET', '/foo', 'not-found'],
      ['GET', '/foo/', 'not-found'],
      ['POST', '/foo/a', 'path-found'],
    ] as const).forEach(([method, path, type]) => {
      test(`does not match "${method} ${path}"`, () => {
        const router = setup();
        expect(router.match(method, path)).toStrictEqual({ type });
      });
    });
  });

  test('single and multi-segment parameters together', () => {
    const router = createRouter<Route>();
    const route = createRoute('GET', '/foo/{foo}/bar/{bar}/{baz+}', vi.fn());
    addRoute(router, route);

    const results = router.match('GET', '/foo/a/bar/b/c/d/e');
    expect(results).toStrictEqual({
      type: 'found',
      value: expect.anything(),
      pathParameters: { foo: 'a', bar: 'b', baz: 'c/d/e' },
    });
  });

  test('case sensitive', () => {
    const router = createRouter<Route>();
    addRoute(router, createRoute('GET', '/foo/bar', vi.fn()));

    expect(router.match('GET', '/foo/Bar')).toStrictEqual({ type: 'not-found' });
  });

  test('prefer literal match', () => {
    const router = createRouter<Route>();
    // NOTE: The order that routes are added should not matter. These are
    // added least specific first to make it clear the router isn't preferring
    // routes added first.
    addRoute(router, createRoute('GET', '/{foo+}', vi.fn()));
    addRoute(router, createRoute('GET', '/foo/{bar+}', vi.fn()));
    addRoute(router, createRoute('GET', '/{foo}/{bar}', vi.fn()));
    addRoute(router, createRoute('GET', '/foo/{bar}', vi.fn()));
    addRoute(router, createRoute('GET', '/foo/bar', vi.fn()));

    // Match a literal route.
    expect(router.match('GET', '/foo/bar').value?.paths)
      .toEqual(['/foo/bar']);

    // Match a single segment over a multi-segment parameter.
    expect(router.match('GET', '/foo/a').value?.paths)
      .toEqual(['/foo/{bar}']);

    // Match multiple single segment parameters over a multi-segment parameter.
    expect(router.match('GET', '/a/b').value?.paths)
      .toEqual(['/{foo}/{bar}']);

    // Match the multi-segment parameter route with the longest literal prefix.
    expect(router.match('GET', '/foo/a/b').value?.paths)
      .toEqual(['/foo/{bar+}']);

    // Last resort.
    expect(router.match('GET', '/a/b/c').value?.paths)
      .toEqual(['/{foo+}']);
  });

  test('error if multi-segment parameter is not last', () => {
    const router = createRouter<Route>();

    expect(() => addRoute(router, createRoute('GET', '/{wild+}/', vi.fn()))).toThrowError();
    expect(() => addRoute(router, createRoute('GET', '/{wild+}/foo', vi.fn()))).toThrowError();
    expect(() => addRoute(router, createRoute('GET', '/foo/{wild+}/bar', vi.fn()))).toThrowError();
  });
});

function addRoute(router: Router<Route>, route: Route): void {
  route.methods.forEach((method) => {
    route.paths.forEach((path) => {
      router.addRoute(method, path, route);
    });
  });
}
