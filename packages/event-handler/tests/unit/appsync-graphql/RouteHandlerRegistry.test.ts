import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteHandlerRegistry } from '../../../src/appsync-graphql/RouteHandlerRegistry.js';
import type { RouteHandlerOptions } from '../../../src/types/appsync-graphql.js';
describe('Class: RouteHandlerRegistry', () => {
  class MockRouteHandlerRegistry extends RouteHandlerRegistry {
    public declare resolvers: Map<string, RouteHandlerOptions>;
  }

  const getRegistry = () => new MockRouteHandlerRegistry({ logger: console });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    { fieldName: 'getPost', typeName: 'Query' },
    { fieldName: 'addPost', typeName: 'Mutation' },
  ])(
    'registers a route handler for a field $fieldName',
    ({ fieldName, typeName }) => {
      // Prepare
      const registry = getRegistry();

      // Act
      registry.register({
        fieldName,
        typeName,
        handler: vi.fn(),
      });

      // Assess
      expect(registry.resolvers.size).toBe(1);
      expect(registry.resolvers.get(`${typeName}.${fieldName}`)).toBeDefined();
    }
  );

  it('logs a warning and replaces the previous handler if the field & type is already registered', () => {
    // Prepare
    const registry = getRegistry();
    const originalHandler = vi.fn();
    const otherHandler = vi.fn();

    // Act
    registry.register({
      fieldName: 'getPost',
      typeName: 'Query',
      handler: originalHandler,
    });
    registry.register({
      fieldName: 'getPost',
      typeName: 'Query',
      handler: otherHandler,
    });

    // Assess
    expect(registry.resolvers.size).toBe(1);
    expect(registry.resolvers.get('Query.getPost')).toEqual({
      fieldName: 'getPost',
      typeName: 'Query',
      handler: otherHandler,
    });
    expect(console.warn).toHaveBeenCalledWith(
      "A route handler for field 'getPost' is already registered for 'Query'. The previous handler will be replaced."
    );
  });

  it('will not replace the handler if the event type is different', () => {
    // Prepare
    const registry = getRegistry();
    const originalHandler = vi.fn();
    const otherHandler = vi.fn();

    // Act
    registry.register({
      fieldName: 'getPost',
      typeName: 'Query',
      handler: originalHandler,
    });
    registry.register({
      fieldName: 'getPost',
      typeName: 'Mutation', // Different type
      handler: otherHandler,
    });

    // Assess
    expect(registry.resolvers.size).toBe(2);
    expect(registry.resolvers.get('Query.getPost')).toEqual({
      fieldName: 'getPost',
      typeName: 'Query',
      handler: originalHandler,
    });
    expect(registry.resolvers.get('Mutation.getPost')).toEqual({
      fieldName: 'getPost',
      typeName: 'Mutation',
      handler: otherHandler,
    });
  });

  it('returns the cached route handler if already evaluated', () => {
    // Prepare
    const registry = getRegistry();
    registry.register({
      fieldName: 'getPost',
      handler: vi.fn(),
      typeName: 'Query',
    });

    // Act
    registry.resolve('Query', 'getPost');
    registry.resolve('Query', 'getPost');

    // Assess
    expect(console.debug).toHaveBeenCalledTimes(2); // once for registration, once for resolution
    expect(console.debug).toHaveBeenLastCalledWith(
      "Resolving handler 'getPost' for type 'Query'"
    );
  });
});
