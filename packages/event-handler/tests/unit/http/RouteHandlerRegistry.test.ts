import { describe, expect, it } from 'vitest';
import {
  HttpVerbs,
  ParameterValidationError,
} from '../../../src/http/index.js';
import { Route } from '../../../src/http/Route.js';
import { RouteHandlerRegistry } from '../../../src/http/RouteHandlerRegistry.js';
import type { Path } from '../../../src/types/http.js';

describe('Class: RouteHandlerRegistry', () => {
  it.each([
    { path: '/test', resolvePath: '/test', type: 'static' },
    { path: '/users/:id', resolvePath: '/users/123', type: 'dynamic' },
  ])(
    'logs a warning when registering a duplicate $type route',
    ({ path, resolvePath }) => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler1 = async () => ({ message: 'first' });
      const handler2 = async () => ({ message: 'second' });
      const method = HttpVerbs.GET;

      // Act
      const route1 = new Route(method, path as Path, handler1);
      registry.register(route1);

      const route2 = new Route(method, path as Path, handler2);
      registry.register(route2);

      // Assess
      expect(console.warn).toHaveBeenCalledWith(
        `Handler for method: ${method} and path: ${path} already exists. The previous handler will be replaced.`
      );

      const result = registry.resolve(method, resolvePath as Path);
      expect(result).not.toBeNull();
      expect(result?.handler).toBe(handler2);
    }
  );

  it.each([
    { path: '/users/:id:', description: 'malformed parameter syntax' },
    { path: '/users/:12345id', description: 'parameter beginning with number' },
    { path: '/users/:', description: 'parameter without name' },
    { path: '/users/:id-name', description: 'parameter with hyphen' },
    { path: '/users/:id.name', description: 'parameter with dot' },
    {
      path: '/users/:id:name',
      description: 'consecutive parameters without separator',
    },
  ])(
    "doesn't register routes with invalid path pattern: $description",
    ({ path }) => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = async () => ({ message: 'test' });

      const route = new Route(HttpVerbs.GET, path as Path, handler);

      // Act
      registry.register(route);

      // Assess
      expect(console.warn).toHaveBeenCalledWith(
        'Malformed parameter syntax. Use :paramName format.'
      );
      expect(registry.resolve(HttpVerbs.GET, '/users/123')).toBeNull();
    }
  );

  it("doesn't register routes with duplicate parameter names", () => {
    // Prepare
    const registry = new RouteHandlerRegistry({ logger: console });
    const handler = async () => ({ message: 'test' });

    // Create a route with duplicate parameter names
    const invalidPath = '/users/:id/posts/:id';
    const route = new Route(HttpVerbs.GET, invalidPath, handler);

    // Act
    registry.register(route);

    // Assess
    expect(console.warn).toHaveBeenCalledWith('Duplicate parameter names: id');
    expect(registry.resolve(HttpVerbs.GET, '/users/123/posts/456')).toBeNull();
  });

  it('returns null when no route is found', () => {
    // Prepare
    const registry = new RouteHandlerRegistry({ logger: console });
    const handler = async () => ({ message: 'test' });

    // Act
    registry.register(new Route(HttpVerbs.GET, '/users', handler));

    // Assess
    expect(registry.resolve(HttpVerbs.GET, '/posts')).toBeNull();
    expect(registry.resolve(HttpVerbs.POST, '/users')).toBeNull();
    expect(registry.resolve(HttpVerbs.GET, '/users/123')).toBeNull();
  });

  it('skips dynamic routes with different HTTP methods', () => {
    // Prepare
    const registry = new RouteHandlerRegistry({ logger: console });
    const getHandler = async () => ({ message: 'get' });
    const postHandler = async () => ({ message: 'post' });

    // Act
    registry.register(new Route(HttpVerbs.GET, '/users/:id', getHandler));
    registry.register(new Route(HttpVerbs.POST, '/users/:id', postHandler));

    // Assess
    const getResult = registry.resolve(HttpVerbs.GET, '/users/123');
    expect(getResult).not.toBeNull();
    expect(getResult?.handler).toBe(getHandler);

    const postResult = registry.resolve(HttpVerbs.POST, '/users/123');
    expect(postResult).not.toBeNull();
    expect(postResult?.handler).toBe(postHandler);
  });

  describe('#compareRouteSpecificity', () => {
    it('handles routes of different specificity', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const generalHandler = async () => ({ message: 'general' });
      const specificHandler = async () => ({ message: 'specific' });
      const mostSpecificHandler = async () => ({ message: 'most-specific' });

      // Act
      registry.register(
        new Route(HttpVerbs.GET, '/:category/:id/:action', generalHandler)
      );
      registry.register(
        new Route(HttpVerbs.GET, '/users/:id/:action', specificHandler)
      );
      registry.register(
        new Route(HttpVerbs.GET, '/users/:id/profile', mostSpecificHandler)
      );

      // Assess
      const result = registry.resolve(HttpVerbs.GET, '/users/123/profile');
      expect(result).not.toBeNull();
      expect(result?.handler).toBe(mostSpecificHandler);
    });

    it('prioritizes static routes over dynamic routes', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const dynamicHandler = async () => ({ message: 'dynamic' });
      const staticHandler = async () => ({ message: 'static' });

      // Act
      registry.register(new Route(HttpVerbs.GET, '/users/:id', dynamicHandler));
      registry.register(
        new Route(HttpVerbs.GET, '/users/profile', staticHandler)
      );

      // Assess
      const result = registry.resolve(HttpVerbs.GET, '/users/profile');
      expect(result).not.toBeNull();
      expect(result?.handler).toBe(staticHandler);
    });

    it('prioritizes deeper paths over shallower ones', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const shallowHandler = async () => ({ message: 'shallow' });
      const deepHandler = async () => ({ message: 'deep' });

      // Act
      registry.register(new Route(HttpVerbs.GET, '/api/:id', shallowHandler));
      registry.register(new Route(HttpVerbs.GET, '/api/v1/:id', deepHandler));

      // Assess
      const result = registry.resolve(HttpVerbs.GET, '/api/v1/123');
      expect(result).not.toBeNull();
      expect(result?.handler).toBe(deepHandler);
    });

    it('prioritizes more specific segments over generic parameters', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const genericHandler = async () => ({ message: 'generic' });
      const specificHandler = async () => ({ message: 'specific' });

      // Act
      registry.register(new Route(HttpVerbs.GET, '/:a/:b', genericHandler));
      registry.register(
        new Route(HttpVerbs.GET, '/users/:id', specificHandler)
      );

      // Assess
      const result = registry.resolve(HttpVerbs.GET, '/users/123');
      expect(result).not.toBeNull();
      expect(result?.handler).toBe(specificHandler);
    });

    it('prioritizes routes with fewer parameters', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const moreParamsHandler = async () => ({ message: 'more-params' });
      const fewerParamsHandler = async () => ({ message: 'fewer-params' });

      // Act
      registry.register(
        new Route(HttpVerbs.GET, '/users/:id/:action', moreParamsHandler)
      );
      registry.register(
        new Route(HttpVerbs.GET, '/users/:id/posts', fewerParamsHandler)
      );

      // Assess
      const result = registry.resolve(HttpVerbs.GET, '/users/123/posts');
      expect(result).not.toBeNull();
      expect(result?.handler).toBe(fewerParamsHandler);
    });

    it('prioritizes static segments over parameters when parameter count differs', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const moreParamsHandler = async () => ({ message: 'more-params' });
      const staticHandler = async () => ({ message: 'static' });

      // Act
      registry.register(
        new Route(HttpVerbs.GET, '/api/:service/:id/:action', moreParamsHandler)
      );
      registry.register(
        new Route(HttpVerbs.GET, '/api/users/123/:action', staticHandler)
      );

      // Assess
      const result = registry.resolve(HttpVerbs.GET, '/api/users/123/delete');
      expect(result).not.toBeNull();
      expect(result?.handler).toBe(staticHandler);
    });

    it('prioritizes more static segments in mixed routes', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const lessStaticHandler = async () => ({ message: 'less-static' });
      const moreStaticHandler = async () => ({ message: 'more-static' });

      // Act
      registry.register(
        new Route(HttpVerbs.GET, '/api/:version/users/:id', lessStaticHandler)
      );
      registry.register(
        new Route(HttpVerbs.GET, '/api/v1/users/:id', moreStaticHandler)
      );

      // Assess
      const result = registry.resolve(HttpVerbs.GET, '/api/v1/users/123');
      expect(result).not.toBeNull();
      expect(result?.handler).toBe(moreStaticHandler);
    });

    it('handles complex mixed static/dynamic precedence', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const allDynamicHandler = async () => ({ message: 'all-dynamic' });
      const mixedHandler = async () => ({ message: 'mixed' });
      const mostStaticHandler = async () => ({ message: 'most-static' });

      // Act
      registry.register(
        new Route(HttpVerbs.GET, '/:category/:id/settings', allDynamicHandler)
      );
      registry.register(
        new Route(HttpVerbs.GET, '/users/:id/settings', mixedHandler)
      );
      registry.register(
        new Route(HttpVerbs.GET, '/users/profile/settings', mostStaticHandler)
      );

      // Assess
      const result = registry.resolve(HttpVerbs.GET, '/users/profile/settings');
      expect(result).not.toBeNull();
      expect(result?.handler).toBe(mostStaticHandler);
    });

    it('maintains specificity regardless of registration order - specific first', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const specificHandler = async () => ({ message: 'specific' });
      const generalHandler = async () => ({ message: 'general' });

      // Act - Register specific route first
      registry.register(
        new Route(HttpVerbs.GET, '/users/:id/profile', specificHandler)
      );
      registry.register(
        new Route(HttpVerbs.GET, '/users/:id/:action', generalHandler)
      );

      // Assess
      const result = registry.resolve(HttpVerbs.GET, '/users/123/profile');
      expect(result).not.toBeNull();
      expect(result?.handler).toBe(specificHandler);
    });

    it('maintains specificity regardless of registration order - general first', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const specificHandler = async () => ({ message: 'specific' });
      const generalHandler = async () => ({ message: 'general' });

      // Act
      registry.register(
        new Route(HttpVerbs.GET, '/users/:id/:action', generalHandler)
      );
      registry.register(
        new Route(HttpVerbs.GET, '/users/:id/profile', specificHandler)
      );

      // Assess
      const result = registry.resolve(HttpVerbs.GET, '/users/123/profile');
      expect(result).not.toBeNull();
      expect(result?.handler).toBe(specificHandler);
    });

    it('handles root-level routes', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const rootHandler = async () => ({ message: 'root' });
      const paramHandler = async () => ({ message: 'param' });

      // Act
      registry.register(new Route(HttpVerbs.GET, '/:id', paramHandler));
      registry.register(new Route(HttpVerbs.GET, '/', rootHandler));

      // Assess
      const rootResult = registry.resolve(HttpVerbs.GET, '/');
      expect(rootResult).not.toBeNull();
      expect(rootResult?.handler).toBe(rootHandler);

      const paramResult = registry.resolve(HttpVerbs.GET, '/123');
      expect(paramResult).not.toBeNull();
      expect(paramResult?.handler).toBe(paramHandler);
    });

    it('handles very long paths with mixed segments', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const longGenericHandler = async () => ({ message: 'long-generic' });
      const longSpecificHandler = async () => ({ message: 'long-specific' });

      // Act
      registry.register(
        new Route(
          HttpVerbs.GET,
          '/api/:v1/:v2/:v3/:v4/:v5/data',
          longGenericHandler
        )
      );
      registry.register(
        new Route(
          HttpVerbs.GET,
          '/api/v1/users/123/profile/settings/data',
          longSpecificHandler
        )
      );

      // Assess
      const result = registry.resolve(
        HttpVerbs.GET,
        '/api/v1/users/123/profile/settings/data'
      );
      expect(result).not.toBeNull();
      expect(result?.handler).toBe(longSpecificHandler);
    });
  });

  describe('Parameter Processing', () => {
    it('extracts single parameter correctly', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = async () => ({ message: 'test' });

      // Act
      registry.register(new Route(HttpVerbs.GET, '/users/:id', handler));
      const result = registry.resolve(HttpVerbs.GET, '/users/123');

      // Assess
      expect(result).not.toBeNull();
      expect(result?.params).toEqual({ id: '123' });
      expect(result?.rawParams).toEqual({ id: '123' });
      expect(result?.handler).toBe(handler);
    });

    it('extracts multiple parameters correctly', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = async () => ({ message: 'test' });

      // Act
      registry.register(
        new Route(HttpVerbs.GET, '/users/:userId/posts/:postId', handler)
      );
      const result = registry.resolve(HttpVerbs.GET, '/users/123/posts/456');

      // Assess
      expect(result).not.toBeNull();
      expect(result?.params).toEqual({ userId: '123', postId: '456' });
      expect(result?.rawParams).toEqual({ userId: '123', postId: '456' });
      expect(result?.handler).toBe(handler);
    });

    it('returns empty params for static routes', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = async () => ({ message: 'test' });

      // Act
      registry.register(new Route(HttpVerbs.GET, '/users/profile', handler));
      const result = registry.resolve(HttpVerbs.GET, '/users/profile');

      // Assess
      expect(result).not.toBeNull();
      expect(result?.params).toEqual({});
      expect(result?.rawParams).toEqual({});
      expect(result?.handler).toBe(handler);
    });

    it('decodes URL-encoded spaces in parameters', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = async () => ({ message: 'test' });

      // Act
      registry.register(new Route(HttpVerbs.GET, '/search/:query', handler));
      const result = registry.resolve(HttpVerbs.GET, '/search/hello%20world');

      // Assess
      expect(result).not.toBeNull();
      expect(result?.params).toEqual({ query: 'hello world' });
      expect(result?.rawParams).toEqual({ query: 'hello%20world' });
    });

    it('decodes URL-encoded special characters in parameters', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = async () => ({ message: 'test' });

      // Act
      registry.register(new Route(HttpVerbs.GET, '/users/:email', handler));
      const result = registry.resolve(
        HttpVerbs.GET,
        '/users/user%40example.com'
      );

      // Assess
      expect(result).not.toBeNull();
      expect(result?.params).toEqual({ email: 'user@example.com' });
      expect(result?.rawParams).toEqual({ email: 'user%40example.com' });
    });

    it('decodes multiple URL-encoded parameters', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = async () => ({ message: 'test' });

      // Act
      registry.register(
        new Route(HttpVerbs.GET, '/files/:folder/:filename', handler)
      );
      const result = registry.resolve(
        HttpVerbs.GET,
        '/files/my%20folder/test%2Bfile.txt'
      );

      // Assess
      expect(result).not.toBeNull();
      expect(result?.params).toEqual({
        folder: 'my folder',
        filename: 'test+file.txt',
      });
      expect(result?.rawParams).toEqual({
        folder: 'my%20folder',
        filename: 'test%2Bfile.txt',
      });
    });

    it('throws ParameterValidationError for whitespace-only parameters', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = async () => ({ message: 'test' });

      // Act
      registry.register(new Route(HttpVerbs.GET, '/users/:id', handler));

      // Assess
      expect(() => {
        registry.resolve(HttpVerbs.GET, '/users/%20%20%20');
      }).toThrow('Parameter validation failed');
    });

    it('extracts parameters with complex route patterns', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = async () => ({ message: 'test' });

      // Act
      registry.register(
        new Route(
          HttpVerbs.GET,
          '/api/:version/users/:userId/posts/:postId/comments/:commentId',
          handler
        )
      );
      const result = registry.resolve(
        HttpVerbs.GET,
        '/api/v1/users/123/posts/456/comments/789'
      );

      // Assess
      expect(result).not.toBeNull();
      expect(result?.params).toEqual({
        version: 'v1',
        userId: '123',
        postId: '456',
        commentId: '789',
      });
      expect(result?.rawParams).toEqual({
        version: 'v1',
        userId: '123',
        postId: '456',
        commentId: '789',
      });
    });

    it('handles mixed parameter types and URL encoding', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = async () => ({ message: 'test' });

      // Act
      registry.register(
        new Route(HttpVerbs.GET, '/search/:category/:query/:page', handler)
      );
      const result = registry.resolve(
        HttpVerbs.GET,
        '/search/electronics/C%2B%2B/1'
      );

      // Assess
      expect(result).not.toBeNull();
      expect(result?.params).toEqual({
        category: 'electronics',
        query: 'C++',
        page: '1',
      });
      expect(result?.rawParams).toEqual({
        category: 'electronics',
        query: 'C%2B%2B',
        page: '1',
      });
    });

    it('throws ParameterValidationError with correct error message for whitespace-only parameter', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = async () => ({ message: 'test' });
      registry.register(new Route(HttpVerbs.GET, '/users/:id', handler));

      // Act & Assess
      expect(() => {
        registry.resolve(HttpVerbs.GET, '/users/%20');
      }).toThrow("Parameter 'id' cannot be empty");
    });

    it('throws ParameterValidationError with multiple error messages for multiple invalid parameters', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = () => ({ message: 'test' });
      registry.register(
        new Route(HttpVerbs.GET, '/api/:version/:resource/:id', handler)
      );

      // Act & Assess
      expect(() => {
        registry.resolve(HttpVerbs.GET, '/api/%20/users/%20');
      }).toThrow(
        new ParameterValidationError([
          "Parameter 'version' cannot be empty",
          "Parameter 'id' cannot be empty",
        ])
      );
    });
  });
});
