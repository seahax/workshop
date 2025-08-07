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
        const route = createRoute({ method: 'GET', path }, vi.fn());
        router.add(route);
        return [router, route];
      }

      test(`does match`, () => {
        const [router, route] = setup();
        const results = router.match('GET', path);
        expect(results).toStrictEqual({ type: 'found', route, pathParameters: {} });
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
      const route = createRoute({ method: 'GET', path: '/foo/{foo}/bar/{bar}' }, vi.fn());
      router.add(route);
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
        expect(results).toStrictEqual({ type: 'found', route: expect.anything(), pathParameters });
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
      const route = createRoute({ method: 'GET', path: '/foo/{bar+}' }, vi.fn());
      router.add(route);
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
          route: expect.anything(),
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
    const router = createRouter();
    const route = createRoute({ method: 'GET', path: '/foo/{foo}/bar/{bar}/{baz+}' }, vi.fn());
    router.add(route);

    const results = router.match('GET', '/foo/a/bar/b/c/d/e');
    expect(results).toStrictEqual({
      type: 'found',
      route: expect.anything(),
      pathParameters: { foo: 'a', bar: 'b', baz: 'c/d/e' },
    });
  });

  test('case sensitive', () => {
    const router = createRouter();
    router.add(createRoute({ method: 'GET', path: '/foo/bar' }, vi.fn()));

    expect(router.match('GET', '/foo/Bar')).toStrictEqual({ type: 'not-found' });
  });

  test('prefer literal match', () => {
    const router = createRouter();
    // NOTE: The order that routes are added should not matter. These are
    // added least specific first to make it clear the router isn't preferring
    // routes added first.
    router.add(createRoute({ method: 'GET', path: '/{foo+}' }, vi.fn()));
    router.add(createRoute({ method: 'GET', path: '/foo/{bar+}' }, vi.fn()));
    router.add(createRoute({ method: 'GET', path: '/{foo}/{bar}' }, vi.fn()));
    router.add(createRoute({ method: 'GET', path: '/foo/{bar}' }, vi.fn()));
    router.add(createRoute({ method: 'GET', path: '/foo/bar' }, vi.fn()));

    // Match a literal route.
    expect(router.match('GET', '/foo/bar').route?.pathTemplates)
      .toEqual(['/foo/bar']);

    // Match a single segment over a multi-segment parameter.
    expect(router.match('GET', '/foo/a').route?.pathTemplates)
      .toEqual(['/foo/{bar}']);

    // Match multiple single segment parameters over a multi-segment parameter.
    expect(router.match('GET', '/a/b').route?.pathTemplates)
      .toEqual(['/{foo}/{bar}']);

    // Match the multi-segment parameter route with the longest literal prefix.
    expect(router.match('GET', '/foo/a/b').route?.pathTemplates)
      .toEqual(['/foo/{bar+}']);

    // Last resort.
    expect(router.match('GET', '/a/b/c').route?.pathTemplates)
      .toEqual(['/{foo+}']);
  });

  test('error on duplicate route', () => {
    const router = createRouter();
    router.add(createRoute({ method: 'GET', path: '/foo/foo' }, vi.fn()));
    router.add(createRoute({ method: 'GET', path: '/foo/{foo}' }, vi.fn()));
    router.add(createRoute({ method: 'GET', path: '/foo/{foo+}' }, vi.fn()));

    // Duplicate literal route.
    expect(() => router.add(createRoute({ method: 'GET', path: '/foo/foo' }, vi.fn()))).toThrowError();
    // Single segment parameter name doesn't doesn't matter for duplication.
    expect(() => router.add(createRoute({ method: 'GET', path: '/foo/{bar}' }, vi.fn()))).toThrowError();
    // Multi-segment parameter name doesn't matter for duplication.
    expect(() => router.add(createRoute({ method: 'GET', path: '/foo/{bar+}' }, vi.fn()))).toThrowError();
  });

  test('error if duplicate parameter names', () => {
    const router = createRouter();

    expect(() => router.add(createRoute({ method: 'GET', path: '/foo/{bar}/{bar}' }, vi.fn()))).toThrowError();
    // Single and multi-segment parameters also can't have the same name.
    expect(() => router.add(createRoute({ method: 'GET', path: '/foo/{bar}/{bar+}' }, vi.fn()))).toThrowError();
  });

  test('error if multi-segment parameter is not last', () => {
    const router = createRouter();

    expect(() => router.add(createRoute({ method: 'GET', path: '/{wild+}/' }, vi.fn()))).toThrowError();
    expect(() => router.add(createRoute({ method: 'GET', path: '/{wild+}/foo' }, vi.fn()))).toThrowError();
    expect(() => router.add(createRoute({ method: 'GET', path: '/foo/{wild+}/bar' }, vi.fn()))).toThrowError();
  });
});
