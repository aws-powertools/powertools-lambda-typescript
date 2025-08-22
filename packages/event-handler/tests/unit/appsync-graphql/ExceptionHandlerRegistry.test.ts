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
    expect(resolved).toBeNull();
  });

  it('registers an exception handler for multiple error classes using an array', () => {
    // Prepare
    class ValidationError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
      }
    }
    class AuthenticationError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
      }
    }
    const handler = vi.fn();
    const registry = getRegistry();

    // Act
    registry.register({
      error: [ValidationError, AuthenticationError],
      handler,
    });

    // Assess
    expect(registry.handlers.size).toBe(2);
    expect(registry.handlers.get('ValidationError')).toEqual({
      error: ValidationError,
      handler,
    });
    expect(registry.handlers.get('AuthenticationError')).toEqual({
      error: AuthenticationError,
      handler,
    });
  });

  it('registers different handlers for different error arrays', () => {
    // Prepare
    class DatabaseError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'DatabaseError';
      }
    }
    class ConnectionError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'ConnectionError';
      }
    }
    class UIError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'UIError';
      }
    }
    const backendHandler = vi.fn();
    const frontendHandler = vi.fn();
    const registry = getRegistry();

    // Act
    registry.register({
      error: [DatabaseError, ConnectionError],
      handler: backendHandler,
    });
    registry.register({
      error: [UIError],
      handler: frontendHandler,
    });

    // Assess
    expect(registry.handlers.size).toBe(3);
    expect(registry.resolve(new DatabaseError('DB failed'))).toBe(
      backendHandler
    );
    expect(registry.resolve(new ConnectionError('Connection failed'))).toBe(
      backendHandler
    );
    expect(registry.resolve(new UIError('UI failed'))).toBe(frontendHandler);
  });

  it('logs warnings and replaces handlers when error classes in array are already registered', () => {
    // Prepare
    class ConflictError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'ConflictError';
      }
    }
    class DuplicateError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'DuplicateError';
      }
    }
    const originalHandler = vi.fn();
    const newHandler = vi.fn();
    const registry = getRegistry();

    // Act
    registry.register({ error: ConflictError, handler: originalHandler });
    registry.register({
      error: [ConflictError, DuplicateError],
      handler: newHandler,
    });

    // Assess
    expect(registry.handlers.size).toBe(2);
    expect(registry.handlers.get('ConflictError')).toEqual({
      error: ConflictError,
      handler: newHandler,
    });
    expect(registry.handlers.get('DuplicateError')).toEqual({
      error: DuplicateError,
      handler: newHandler,
    });
    expect(console.warn).toHaveBeenCalledWith(
      "An exception handler for error class 'ConflictError' is already registered. The previous handler will be replaced."
    );
  });

  it('handles mixed registration of single errors and error arrays', () => {
    // Prepare
    class SingleError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'SingleError';
      }
    }
    class ArrayError1 extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'ArrayError1';
      }
    }
    class ArrayError2 extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'ArrayError2';
      }
    }
    const singleHandler = vi.fn();
    const arrayHandler = vi.fn();
    const registry = getRegistry();

    // Act
    registry.register({ error: SingleError, handler: singleHandler });
    registry.register({
      error: [ArrayError1, ArrayError2],
      handler: arrayHandler,
    });

    // Assess
    expect(registry.handlers.size).toBe(3);
    expect(registry.resolve(new SingleError('Single error'))).toBe(
      singleHandler
    );
    expect(registry.resolve(new ArrayError1('Array error 1'))).toBe(
      arrayHandler
    );
    expect(registry.resolve(new ArrayError2('Array error 2'))).toBe(
      arrayHandler
    );
  });

  it('handles empty array of errors gracefully', () => {
    // Prepare
    const handler = vi.fn();
    const registry = getRegistry();

    // Act
    registry.register({ error: [], handler });

    // Assess
    expect(registry.handlers.size).toBe(0);
  });
});
