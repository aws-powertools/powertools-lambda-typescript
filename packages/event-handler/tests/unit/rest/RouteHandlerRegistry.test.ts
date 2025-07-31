import { describe, expect, it } from 'vitest';
import { HttpVerbs } from '../../../src/rest/constants.js';
import { Route } from '../../../src/rest/Route.js';
import { RouteHandlerRegistry } from '../../../src/rest/RouteHandlerRegistry.js';
import type { Path } from '../../../src/types/rest.js';

describe('Class: RouteHandlerRegistry', () => {
  it('should warn when registering a duplicate route', () => {
    // Prepare
    const registry = new RouteHandlerRegistry({ logger: console });
    const handler = () => 'test';
    const path = '/test';
    const method = HttpVerbs.GET;

    // Act
    const route1 = new Route(method, path, handler);
    registry.register(route1);

    const route2 = new Route(method, path, () => 'another handler');
    registry.register(route2);

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      `Handler for method: ${method} and path: ${path} already exists. The previous handler will be replaced.`
    );
    expect(registry.getRouteCount()).toBe(1);

    const routes = registry.getAllRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0]).toBe(route2);
  });

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
    'should not register routes with invalid path pattern: $description',
    ({ path }) => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = () => 'test';

      const route = new Route(HttpVerbs.GET, path as Path, handler);

      // Act
      registry.register(route);

      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        'Malformed parameter syntax. Use :paramName format.'
      );
      expect(registry.getRouteCount()).toBe(0);
      expect(registry.getAllRoutes()).toHaveLength(0);
      expect(registry.getRoutesByMethod(HttpVerbs.GET)).toHaveLength(0);
    }
  );

  it('should not register routes with duplicate parameter names', () => {
    // Prepare
    const registry = new RouteHandlerRegistry({ logger: console });
    const handler = () => 'test';

    // Create a route with duplicate parameter names
    const invalidPath = '/users/:id/posts/:id';
    const route = new Route(HttpVerbs.GET, invalidPath, handler);

    // Act
    registry.register(route);

    // Assert
    expect(console.warn).toHaveBeenCalledWith('Duplicate parameter names: id');
    expect(registry.getRouteCount()).toBe(0); // Route should not be registered
    expect(registry.getAllRoutes()).toHaveLength(0);
    expect(registry.getRoutesByMethod(HttpVerbs.GET)).toHaveLength(0);
  });

  describe('getRouteCount', () => {
    it('returns 0 for empty registry', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });

      // Act & Assert
      expect(registry.getRouteCount()).toBe(0);
    });

    it('returns correct count after registering routes', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = () => 'test';

      // Act & Assert
      registry.register(new Route(HttpVerbs.GET, '/users', handler));
      expect(registry.getRouteCount()).toBe(1);

      registry.register(new Route(HttpVerbs.POST, '/users', handler));
      expect(registry.getRouteCount()).toBe(2);

      registry.register(new Route(HttpVerbs.GET, '/posts', handler));
      expect(registry.getRouteCount()).toBe(3);
    });
  });

  describe('getRoutesByMethod', () => {
    it('returns empty array for non-existent method', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });

      // Act & Assert
      expect(registry.getRoutesByMethod('GET')).toEqual([]);
      expect(registry.getRoutesByMethod('POST')).toEqual([]);
    });

    it.each([
      { method: HttpVerbs.GET },
      { method: HttpVerbs.POST },
      { method: HttpVerbs.PUT },
      { method: HttpVerbs.DELETE },
    ])('returns routes for $method method', ({ method }) => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = () => 'test';

      const route1 = new Route(method, '/users', handler);
      const route2 = new Route(method, '/posts', handler);
      const otherMethodRoute = new Route(HttpVerbs.PATCH, '/other', handler);

      // Act
      registry.register(route1);
      registry.register(route2);
      registry.register(otherMethodRoute);

      // Assert
      const routes = registry.getRoutesByMethod(method);
      expect(routes).toHaveLength(2);
      expect(routes).toContain(route1);
      expect(routes).toContain(route2);
      expect(routes).not.toContain(otherMethodRoute);
    });

    it('handles case-insensitive method lookup', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = () => 'test';

      const getRoute = new Route(HttpVerbs.GET, '/users', handler);

      // Act
      registry.register(getRoute);

      // Assert
      expect(registry.getRoutesByMethod('get')).toContain(getRoute);
      expect(registry.getRoutesByMethod('GET')).toContain(getRoute);
      expect(registry.getRoutesByMethod('Get')).toContain(getRoute);
    });
  });

  describe('getAllRoutes', () => {
    it('returns empty array for empty registry', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });

      // Act & Assert
      expect(registry.getAllRoutes()).toEqual([]);
    });

    it('returns all registered routes', () => {
      // Prepare
      const registry = new RouteHandlerRegistry({ logger: console });
      const handler = () => 'test';

      const route1 = new Route(HttpVerbs.GET, '/users', handler);
      const route2 = new Route(HttpVerbs.POST, '/users', handler);
      const route3 = new Route(HttpVerbs.GET, '/posts', handler);

      // Act
      registry.register(route1);
      registry.register(route2);
      registry.register(route3);

      // Assert
      const allRoutes = registry.getAllRoutes();
      expect(allRoutes).toHaveLength(3);
      expect(allRoutes).toContain(route1);
      expect(allRoutes).toContain(route2);
      expect(allRoutes).toContain(route3);
    });
  });
});
