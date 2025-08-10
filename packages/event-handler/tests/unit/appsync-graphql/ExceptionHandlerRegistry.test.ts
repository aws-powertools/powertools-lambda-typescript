import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExceptionHandlerRegistry } from '../../../src/appsync-graphql/ExceptionHandlerRegistry.js';
import type { ExceptionHandlerOptions } from '../../../src/types/appsync-graphql.js';

describe('Class: ExceptionHandlerRegistry', () => {
  class MockExceptionHandlerRegistry extends ExceptionHandlerRegistry {
    public declare handlers: Map<string, ExceptionHandlerOptions>;
  }
  class CustomError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'CustomError';
    }
  }

  const getRegistry = () =>
    new MockExceptionHandlerRegistry({ logger: console });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers an exception handler for an error class', () => {
    // Prepare
    const handler = vi.fn();
    const registry = getRegistry();

    // Act
    registry.register({ error: CustomError, handler });

    // Assess
    expect(registry.handlers.size).toBe(1);
    expect(registry.handlers.get('CustomError')).toBeDefined();
  });

  it('logs a warning and replaces the previous handler if the error class is already registered', () => {
    // Prepare
    const originalHandler = vi.fn();
    const otherHandler = vi.fn();
    const registry = getRegistry();

    // Act
    registry.register({ error: CustomError, handler: originalHandler });
    registry.register({ error: CustomError, handler: otherHandler });

    // Assess
    expect(registry.handlers.size).toBe(1);
    expect(registry.handlers.get('CustomError')).toEqual({
      error: CustomError,
      handler: otherHandler,
    });
    expect(console.warn).toHaveBeenCalledWith(
      "An exception handler for error class 'CustomError' is already registered. The previous handler will be replaced."
    );
  });

  it('resolve returns the correct handler for a registered error instance', () => {
    // Prepare
    const customErrorHandler = vi.fn();
    const rangeErrorHandler = vi.fn();
    const registry = getRegistry();

    // Act
    registry.register({ error: CustomError, handler: customErrorHandler });
    registry.register({ error: RangeError, handler: rangeErrorHandler });
    const resolved = registry.resolve(new CustomError('fail'));

    // Assess
    expect(resolved).toBe(customErrorHandler);
  });

  it('resolve returns undefined if no handler is registered for the error', () => {
    // Prepare
    class OtherError extends Error {}
    const handler = vi.fn();
    const registry = getRegistry();

    // Act
    registry.register({ error: CustomError, handler });
    const resolved = registry.resolve(new OtherError('fail'));

    // Assess
    expect(resolved).toBeUndefined();
  });
});
