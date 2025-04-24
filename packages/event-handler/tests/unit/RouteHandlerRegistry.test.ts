import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteHandlerRegistry } from '../../src/appsync-events/RouteHandlerRegistry.js';
import type { RouteHandlerOptions } from '../../src/types/appsync-events.js';

describe('Class: RouteHandlerRegistry', () => {
  class MockRouteHandlerRegistry extends RouteHandlerRegistry {
    public declare resolvers: Map<string, RouteHandlerOptions<boolean>>;
  }

  const getRegistry = () => new MockRouteHandlerRegistry({ logger: console });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    { path: '/foo', expected: '^\\/foo$' },
    { path: '/*', expected: '^\\/.*$' },
    { path: '/foo/*', expected: '^\\/foo\\/.*$' },
  ])('registers a route handler for a path $path', ({ path, expected }) => {
    // Prepare
    const registry = getRegistry();

    // Act
    registry.register({
      path,
      handler: vi.fn(),
      aggregate: false,
    });

    // Assess
    expect(registry.resolvers.size).toBe(1);
    expect(registry.resolvers.get(expected)).toBeDefined();
  });

  it('logs a warning and replaces the previous handler if the path is already registered', () => {
    // Prepare
    const registry = getRegistry();
    const originalHandler = vi.fn();
    const otherHandler = vi.fn();

    // Act
    registry.register({
      path: '/foo',
      handler: originalHandler,
      aggregate: true,
    });
    registry.register({
      path: '/foo',
      handler: otherHandler,
    });

    // Assess
    expect(registry.resolvers.size).toBe(1);
    expect(registry.resolvers.get('^\\/foo$')).toEqual({
      path: '/foo',
      handler: otherHandler,
      aggregate: false,
    });
    expect(console.warn).toHaveBeenCalledWith(
      `A route handler for path '/foo' is already registered for onPublish. The previous handler will be replaced.`
    );
  });

  it('logs a warning and skips registration if the path is not valid', () => {
    // Prepare
    const registry = getRegistry();

    // Act
    registry.register({
      path: 'invalid-path',
      handler: vi.fn(),
      aggregate: false,
    });

    // Assess
    expect(registry.resolvers.size).toBe(0);
    expect(console.warn).toHaveBeenCalledWith(
      `The path 'invalid-path' registered for onPublish is not valid and will be skipped. A path should always have a namespace starting with '/'. A path can have multiple namespaces, all separated by '/'. Wildcards are allowed only at the end of the path.`
    );
  });

  it.each([
    { path: '/foo', expected: true },
    { path: '/foo/*', expected: true },
    { path: '/*', expected: true },
    { path: '/foo/bar', expected: true },
    { path: '/foo/bar/*', expected: true },
    { path: '/foo//bar', expected: false },
    { path: '/foo/bar//', expected: false },
    { path: '/foo/bar/*/baz', expected: false },
    { path: 'invalid-path', expected: false },
  ])('correctly validates paths $path', ({ path, expected }) => {
    // Act
    const isValid = MockRouteHandlerRegistry.isValidPath(path);

    // Assess
    expect(isValid).toBe(expected);
  });

  it.each([
    {
      paths: ['/foo', '/foo/*', '/*'],
      event: '/foo/bar',
      expected: '/foo/*',
    },
    {
      paths: ['/foo', '/foo/*', '/*'],
      event: '/bar',
      expected: '/*',
    },
    {
      paths: ['/foo', '/foo/*', '/*'],
      event: '/foo',
      expected: '/foo',
    },
    {
      paths: ['/foo/*', '/*'],
      event: '/foo/bar',
      expected: '/foo/*',
    },
    {
      paths: ['/*'],
      event: '/bar',
      expected: '/*',
    },
    {
      paths: ['/*'],
      event: '/foo/bar',
      expected: '/*',
    },
    {
      paths: ['/foo/bar'],
      event: '/foo/bar/baz',
      expected: undefined,
    },
  ])('resolves the most specific path $event', ({ paths, event, expected }) => {
    // Prepare
    const registry = getRegistry();
    for (const path of paths) {
      registry.register({
        path,
        handler: vi.fn(),
      });
    }

    // Act
    const resolved = registry.resolve(event);

    // Assess
    expect(resolved?.path).toBe(expected);
  });

  it('returns the cached route handler if already evaluated', () => {
    // Prepare
    const registry = getRegistry();
    registry.register({
      path: '/foo',
      handler: vi.fn(),
      aggregate: false,
    });

    // Act
    registry.resolve('/foo');
    registry.resolve('/foo');

    // Assess
    expect(console.debug).toHaveBeenCalledTimes(2); // once for registration, once for resolution
    expect(console.debug).toHaveBeenLastCalledWith(
      `Resolving handler for path '/foo'`
    );
  });
});
