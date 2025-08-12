import { describe, expect, it } from 'vitest';
import { HttpErrorCodes } from '../../../src/rest/constants.js';
import { ErrorHandlerRegistry } from '../../../src/rest/ErrorHandlerRegistry.js';
import type { HttpStatusCode } from '../../../src/types/rest.js';

const createErrorHandler =
  (statusCode: HttpStatusCode, message?: string) => (error: Error) => ({
    statusCode,
    error: error.name,
    message: message ?? error.message,
  });

class CustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomError';
  }
}

class AnotherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnotherError';
  }
}

class InheritedError extends CustomError {
  constructor(message: string) {
    super(message);
    this.name = 'InheritedError';
  }
}

describe('Class: ErrorHandlerRegistry', () => {
  it('logs a warning when registering a duplicate error handler', () => {
    // Prepare
    const registry = new ErrorHandlerRegistry({ logger: console });
    const handler1 = createErrorHandler(HttpErrorCodes.BAD_REQUEST, 'first');
    const handler2 = createErrorHandler(HttpErrorCodes.NOT_FOUND, 'second');

    // Act
    registry.register(CustomError, handler1);
    registry.register(CustomError, handler2);

    // Assess
    expect(console.warn).toHaveBeenCalledWith(
      'Handler for CustomError already exists. The previous handler will be replaced.'
    );

    const result = registry.resolve(new CustomError('test'));
    expect(result).toBe(handler2);
  });

  it('registers handlers for multiple error types', () => {
    // Prepare
    const registry = new ErrorHandlerRegistry({ logger: console });
    const handler = createErrorHandler(HttpErrorCodes.BAD_REQUEST);

    // Act
    registry.register([CustomError, AnotherError], handler);

    // Assess
    expect(registry.resolve(new CustomError('test'))).toBe(handler);
    expect(registry.resolve(new AnotherError('test'))).toBe(handler);
  });

  it('resolves handlers using exact constructor match', () => {
    // Prepare
    const registry = new ErrorHandlerRegistry({ logger: console });
    const customHandler = createErrorHandler(HttpErrorCodes.BAD_REQUEST);
    const anotherHandler = createErrorHandler(
      HttpErrorCodes.INTERNAL_SERVER_ERROR
    );

    // Act
    registry.register(CustomError, customHandler);
    registry.register(AnotherError, anotherHandler);

    // Assess
    expect(registry.resolve(new CustomError('test'))).toBe(customHandler);
    expect(registry.resolve(new AnotherError('test'))).toBe(anotherHandler);
  });

  it('resolves handlers using instanceof for inheritance', () => {
    // Prepare
    const registry = new ErrorHandlerRegistry({ logger: console });
    const baseHandler = createErrorHandler(HttpErrorCodes.BAD_REQUEST);

    // Act
    registry.register(CustomError, baseHandler);

    // Assess
    const inheritedError = new InheritedError('test');
    expect(registry.resolve(inheritedError)).toBe(baseHandler);
  });

  it('resolves handlers using name-based matching', () => {
    // Prepare
    const registry = new ErrorHandlerRegistry({ logger: console });
    const handler = createErrorHandler(HttpErrorCodes.BAD_REQUEST);

    // Act
    registry.register(CustomError, handler);

    const errorWithSameName = new Error('test');
    errorWithSameName.name = 'CustomError';

    // Assess
    expect(registry.resolve(errorWithSameName)).toBe(handler);
  });

  it('returns null when no handler is found', () => {
    // Prepare
    const registry = new ErrorHandlerRegistry({ logger: console });
    const handler = createErrorHandler(HttpErrorCodes.BAD_REQUEST);

    // Act
    registry.register(CustomError, handler);

    // Assess
    expect(registry.resolve(new AnotherError('test'))).toBeNull();
    expect(registry.resolve(new Error('test'))).toBeNull();
  });

  it('prioritizes exact constructor match over instanceof', () => {
    // Prepare
    const registry = new ErrorHandlerRegistry({ logger: console });
    const baseHandler = createErrorHandler(HttpErrorCodes.BAD_REQUEST);
    const specificHandler = createErrorHandler(
      HttpErrorCodes.INTERNAL_SERVER_ERROR
    );

    // Act
    registry.register(CustomError, baseHandler);
    registry.register(InheritedError, specificHandler);

    // Assess
    expect(registry.resolve(new InheritedError('test'))).toBe(specificHandler);
  });

  it('prioritizes instanceof match over name-based matching', () => {
    // Prepare
    const registry = new ErrorHandlerRegistry({ logger: console });
    const baseHandler = createErrorHandler(HttpErrorCodes.BAD_REQUEST);
    const nameHandler = createErrorHandler(
      HttpErrorCodes.INTERNAL_SERVER_ERROR
    );

    // Create a class with different name but register with name matching
    class DifferentNameError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError'; // Same name as CustomError
      }
    }

    // Act
    registry.register(CustomError, baseHandler);
    registry.register(DifferentNameError, nameHandler);

    const error = new DifferentNameError('test');

    // Assess
    expect(registry.resolve(error)).toBe(nameHandler);
  });
});
