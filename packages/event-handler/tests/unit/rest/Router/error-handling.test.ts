import context from '@aws-lambda-powertools/testing-utils/context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestError,
  HttpErrorCodes,
  InternalServerError,
  MethodNotAllowedError,
  Router,
} from '../../../../src/rest/index.js';
import { createTestEvent } from '../helpers.js';

describe('Class: Router - Error Handling', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  it('calls registered error handler when BadRequestError is thrown', async () => {
    // Prepare
    const app = new Router();
    vi.stubEnv('POWERTOOLS_DEV', 'true');

    app.errorHandler(BadRequestError, async (error) => ({
      statusCode: HttpErrorCodes.BAD_REQUEST,
      error: 'Bad Request',
      message: `Handled: ${error.message}`,
    }));

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpErrorCodes.BAD_REQUEST,
      body: JSON.stringify({
        statusCode: HttpErrorCodes.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Handled: test error',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('calls notFound handler when route is not found', async () => {
    // Prepare
    const app = new Router();

    app.notFound(async (error) => ({
      statusCode: HttpErrorCodes.NOT_FOUND,
      error: 'Not Found',
      message: `Custom: ${error.message}`,
    }));

    // Act
    const result = await app.resolve(
      createTestEvent('/nonexistent', 'GET'),
      context
    );

    // Assess
    expect(result).toEqual({
      statusCode: HttpErrorCodes.NOT_FOUND,
      body: JSON.stringify({
        statusCode: HttpErrorCodes.NOT_FOUND,
        error: 'Not Found',
        message: 'Custom: Route /nonexistent for method GET not found',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('calls methodNotAllowed handler when MethodNotAllowedError is thrown', async () => {
    // Prepare
    const app = new Router();

    app.methodNotAllowed(async (error) => ({
      statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
      error: 'Method Not Allowed',
      message: `Custom: ${error.message}`,
    }));

    app.get('/test', () => {
      throw new MethodNotAllowedError('POST not allowed');
    });

    // Act
    const result = await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
      body: JSON.stringify({
        statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
        error: 'Method Not Allowed',
        message: 'Custom: POST not allowed',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('falls back to default error handler when registered handler throws', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', '');
    const app = new Router();

    app.errorHandler(BadRequestError, async () => {
      throw new Error('Handler failed');
    });

    app.get('/test', () => {
      throw new BadRequestError('original error');
    });

    // Act
    const result = await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    const body = JSON.parse(result?.body ?? '{}');
    expect(body.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('Internal Server Error');
  });

  it('uses default handling when no error handler is registered', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', '');
    const app = new Router();

    app.get('/test', () => {
      throw new Error('unhandled error');
    });

    // Act
    const result = await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    const body = JSON.parse(result?.body ?? '{}');
    expect(body.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('Internal Server Error');
  });

  it('calls most specific error handler when multiple handlers match', async () => {
    // Prepare
    const app = new Router();

    app.errorHandler(Error, async () => ({
      statusCode: HttpErrorCodes.INTERNAL_SERVER_ERROR,
      error: 'Generic Error',
      message: 'Generic handler',
    }));

    app.errorHandler(BadRequestError, async () => ({
      statusCode: HttpErrorCodes.BAD_REQUEST,
      error: 'Bad Request',
      message: 'Specific handler',
    }));

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpErrorCodes.BAD_REQUEST,
      body: JSON.stringify({
        statusCode: HttpErrorCodes.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Specific handler',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('uses ServiceError toJSON method when no custom handler is registered', async () => {
    // Prepare
    const app = new Router();

    app.get('/test', () => {
      throw new InternalServerError('service error');
    });

    // Act
    const result = await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpErrorCodes.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        statusCode: HttpErrorCodes.INTERNAL_SERVER_ERROR,
        error: 'InternalServerError',
        message: 'service error',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('hides error details when POWERTOOLS_DEV env var is not set', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', '');
    const app = new Router();

    app.get('/test', () => {
      throw new Error('sensitive error details');
    });

    // Act
    const result = await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    const body = JSON.parse(result?.body ?? '{}');
    expect(body.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('Internal Server Error');
    expect(body.stack).toBeUndefined();
    expect(body.details).toBeUndefined();
  });

  it('shows error details in development mode', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', 'true');
    const app = new Router();

    app.get('/test', () => {
      throw new Error('debug error details');
    });

    // Act
    const result = await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    const body = JSON.parse(result?.body ?? '{}');
    expect(body.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('debug error details');
    expect(body.stack).toBeDefined();
    expect(body.details).toBeDefined();
    expect(body.details.errorName).toBe('Error');
  });

  it('accepts array of error types for single handler', async () => {
    // Prepare
    const app = new Router();

    app.errorHandler(
      [BadRequestError, MethodNotAllowedError],
      async (error: Error) => ({
        statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
        error: 'Validation Error',
        message: `Array handler: ${error.message}`,
      })
    );

    app.get('/bad', () => {
      throw new BadRequestError('bad request');
    });

    app.get('/method', () => {
      throw new MethodNotAllowedError('method not allowed');
    });

    // Act
    const badResult = await app.resolve(
      createTestEvent('/bad', 'GET'),
      context
    );
    const methodResult = await app.resolve(
      createTestEvent('/method', 'GET'),
      context
    );

    // Assess
    const expectedBadResult = {
      statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
      body: JSON.stringify({
        statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
        error: 'Validation Error',
        message: 'Array handler: bad request',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    };
    const expectedMethodResult = {
      statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
      body: JSON.stringify({
        statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
        error: 'Validation Error',
        message: 'Array handler: method not allowed',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    };

    expect(badResult).toEqual(expectedBadResult);
    expect(methodResult).toEqual(expectedMethodResult);
  });

  it('replaces previous handler when registering new handler for same error type', async () => {
    // Prepare
    const app = new Router();

    app.errorHandler(BadRequestError, async () => ({
      statusCode: HttpErrorCodes.BAD_REQUEST,
      error: 'First Handler',
      message: 'first',
    }));

    app.errorHandler(BadRequestError, async (error) => ({
      statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
      error: 'Second Handler',
      message: `second: ${error.message}`,
    }));

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
      body: JSON.stringify({
        statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
        error: 'Second Handler',
        message: 'second: test error',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('returns response with correct Content-Type header', async () => {
    // Prepare
    const app = new Router();

    app.errorHandler(BadRequestError, async (error) => ({
      statusCode: HttpErrorCodes.BAD_REQUEST,
      error: 'Bad Request',
      message: error.message,
    }));

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(result?.headers?.['content-type']).toBe('application/json');
  });

  it('passes request, event, and context to functional error handlers', async () => {
    // Prepare
    const app = new Router();
    const testEvent = createTestEvent('/test', 'GET');

    app.errorHandler(BadRequestError, async (error, options) => ({
      statusCode: HttpErrorCodes.BAD_REQUEST,
      error: 'Bad Request',
      message: error.message,
      hasRequest: options.request instanceof Request,
      hasEvent: options.event === testEvent,
      hasContext: options.context === context,
    }));

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(testEvent, context);
    const body = JSON.parse(result?.body ?? '{}');

    // Assess
    expect(body.hasRequest).toBe(true);
    expect(body.hasEvent).toBe(true);
    expect(body.hasContext).toBe(true);
  });
});
