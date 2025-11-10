import context from '@aws-lambda-powertools/testing-utils/context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestError,
  HttpStatusCodes,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  Router,
} from '../../../../src/rest/index.js';
import { createTestEvent, createTestEventV2 } from '../helpers.js';

describe.each([
  { version: 'V1', createEvent: createTestEvent },
  { version: 'V2', createEvent: createTestEventV2 },
])('Class: Router - Error Handling ($version)', ({ createEvent }) => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  it('calls registered error handler when BadRequestError is thrown', async () => {
    // Prepare
    const app = new Router();
    vi.stubEnv('POWERTOOLS_DEV', 'true');

    app.errorHandler(BadRequestError, async (error) => ({
      statusCode: HttpStatusCodes.BAD_REQUEST,
      error: 'Bad Request',
      message: `Handled: ${error.message}`,
    }));

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.BAD_REQUEST,
      body: JSON.stringify({
        statusCode: HttpStatusCodes.BAD_REQUEST,
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
      error: 'Not Found',
      message: `Custom: ${error.message}`,
    }));

    // Act
    const result = await app.resolve(
      createEvent('/nonexistent', 'GET'),
      context
    );

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.NOT_FOUND,
      body: JSON.stringify({
        error: 'Not Found',
        message: 'Custom: Route /nonexistent for method GET not found',
        statusCode: HttpStatusCodes.NOT_FOUND,
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('calls methodNotAllowed handler when MethodNotAllowedError is thrown', async () => {
    // Prepare
    const app = new Router();

    app.methodNotAllowed(async (error) => ({
      error: 'Method Not Allowed',
      message: `Custom: ${error.message}`,
    }));

    app.get('/test', () => {
      throw new MethodNotAllowedError('POST not allowed');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.METHOD_NOT_ALLOWED,
      body: JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Custom: POST not allowed',
        statusCode: HttpStatusCodes.METHOD_NOT_ALLOWED,
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('falls back to default error handler when registered handler throws', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', '');
    const app = new Router();

    app.errorHandler(BadRequestError, () => {
      throw new Error('Handler failed');
    });

    app.get('/test', () => {
      throw new BadRequestError('original error');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Internal Server Error',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('uses default handling when no error handler is registered', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', '');
    const app = new Router();

    app.get('/test', () => {
      throw new Error('unhandled error');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Internal Server Error',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('calls most specific error handler when multiple handlers match', async () => {
    // Prepare
    const app = new Router();

    app.errorHandler(Error, async () => ({
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      error: 'Generic Error',
      message: 'Generic handler',
    }));

    app.errorHandler(BadRequestError, async () => ({
      statusCode: HttpStatusCodes.BAD_REQUEST,
      error: 'Bad Request',
      message: 'Specific handler',
    }));

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.BAD_REQUEST,
      body: JSON.stringify({
        statusCode: HttpStatusCodes.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Specific handler',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('uses HttpError toJSON method when no custom handler is registered', async () => {
    // Prepare
    const app = new Router();

    app.get('/test', () => {
      throw new InternalServerError('service error');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
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
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Internal Server Error',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('shows error details in development mode', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', 'true');
    const app = new Router();

    app.get('/test', () => {
      throw new Error('debug error details');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(result.headers).toEqual({ 'content-type': 'application/json' });
    expect(result.isBase64Encoded).toBe(false);

    const body = JSON.parse(result.body ?? '{}');
    expect(body.statusCode).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
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
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY,
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
    const badResult = await app.resolve(createEvent('/bad', 'GET'), context);
    const methodResult = await app.resolve(
      createEvent('/method', 'GET'),
      context
    );

    // Assess
    const expectedBadResult = {
      statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY,
      body: JSON.stringify({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY,
        error: 'Validation Error',
        message: 'Array handler: bad request',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    };
    const expectedMethodResult = {
      statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY,
      body: JSON.stringify({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY,
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
      statusCode: HttpStatusCodes.BAD_REQUEST,
      error: 'First Handler',
      message: 'first',
    }));

    app.errorHandler(BadRequestError, async (error) => ({
      statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY,
      error: 'Second Handler',
      message: `second: ${error.message}`,
    }));

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY,
      body: JSON.stringify({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY,
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
      statusCode: HttpStatusCodes.BAD_REQUEST,
      error: 'Bad Request',
      message: error.message,
    }));

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result.headers?.['content-type']).toBe('application/json');
  });

  it('passes request, event, and context to functional error handlers', async () => {
    // Prepare
    const app = new Router();
    const testEvent = createEvent('/test', 'GET');

    app.errorHandler(BadRequestError, async (error, reqCtx) => ({
      statusCode: HttpStatusCodes.BAD_REQUEST,
      error: 'Bad Request',
      message: error.message,
      hasRequest: reqCtx.req instanceof Request,
      hasEvent: reqCtx.event === testEvent,
      hasContext: reqCtx.context === context,
    }));

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(testEvent, context);
    const body = JSON.parse(result.body ?? '{}');

    // Assess
    expect(body.hasRequest).toBe(true);
    expect(body.hasEvent).toBe(true);
    expect(body.hasContext).toBe(true);
  });

  it('handles returning a Response from the error handler', async () => {
    // Prepare
    const app = new Router();

    app.errorHandler(
      BadRequestError,
      async () =>
        new Response(
          JSON.stringify({
            foo: 'bar',
          }),
          {
            status: HttpStatusCodes.BAD_REQUEST,
            headers: {
              'content-type': 'application/json',
            },
          }
        )
    );

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.BAD_REQUEST,
      body: JSON.stringify({
        foo: 'bar',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('handles returning an API Gateway Proxy result from the error handler', async () => {
    // Prepare
    const app = new Router();

    app.errorHandler(BadRequestError, async () => ({
      statusCode: HttpStatusCodes.BAD_REQUEST,
      body: JSON.stringify({
        foo: 'bar',
      }),
    }));

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.BAD_REQUEST,
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
      body: JSON.stringify({
        foo: 'bar',
      }),
    });
  });

  it('handles returning a JSONObject from the error handler', async () => {
    // Prepare
    const app = new Router();

    app.errorHandler(BadRequestError, async () => ({ foo: 'bar' }));

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        foo: 'bar',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('handles throwing a built in NotFound error from the error handler', async () => {
    // Prepare
    const app = new Router();

    app.errorHandler(BadRequestError, () => {
      throw new NotFoundError('This error is thrown from the error handler');
    });

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.NOT_FOUND,
      body: JSON.stringify({
        statusCode: HttpStatusCodes.NOT_FOUND,
        error: 'NotFoundError',
        message: 'This error is thrown from the error handler',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('handles throwing a built in MethodNotAllowedError error from the error handler', async () => {
    // Prepare
    const app = new Router();

    app.errorHandler(BadRequestError, () => {
      throw new MethodNotAllowedError(
        'This error is thrown from the error handler'
      );
    });

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: HttpStatusCodes.METHOD_NOT_ALLOWED,
      body: JSON.stringify({
        statusCode: HttpStatusCodes.METHOD_NOT_ALLOWED,
        error: 'MethodNotAllowedError',
        message: 'This error is thrown from the error handler',
      }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('handles throwing a generic error from the error handler', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', 'true');
    const app = new Router();

    app.errorHandler(BadRequestError, () => {
      throw new Error('This error is thrown from the error handler');
    });

    app.get('/test', () => {
      throw new BadRequestError('test error');
    });

    // Act
    const result = await app.resolve(createEvent('/test', 'GET'), context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(result.headers).toEqual({ 'content-type': 'application/json' });
    expect(result.isBase64Encoded).toBe(false);

    const body = JSON.parse(result.body ?? '{}');
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('This error is thrown from the error handler');
    expect(body.stack).toBeDefined();
    expect(body.details).toEqual({
      errorName: 'Error',
    });
  });

  it('handles BinaryResult from error handlers', async () => {
    // Prepare
    const app = new Router();
    const { buffer } = new TextEncoder().encode('error binary data');

    class CustomError extends Error {}

    app.errorHandler(CustomError, async () => buffer);
    app.get('/error', () => {
      throw new CustomError('test error');
    });

    // Act
    const result = await app.resolve(createEvent('/error', 'GET'), context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(result.isBase64Encoded).toBe(true);
    expect(result.body).toBe(Buffer.from(buffer).toString('base64'));
  });

  it('sets isBase64Encoded when notFound handler returns BinaryResult', async () => {
    // Prepare
    const app = new Router();
    const buffer = new TextEncoder().encode('not found binary');

    app.notFound(async () => buffer.buffer);

    // Act
    const result = await app.resolve(
      createEvent('/nonexistent', 'GET'),
      context
    );

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.OK);
    expect(result.isBase64Encoded).toBe(true);
    expect(result.body).toBe(Buffer.from(buffer.buffer).toString('base64'));
  });
});
describe('Class: Router - proxyEventToWebRequest Error Handling', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('re-throws non-InvalidHttpMethodError from proxyEventToWebRequest', async () => {
    // Prepare
    vi.doMock('../../../../src/rest/converters.js', async () => {
      const actual = await vi.importActual<
        typeof import('../../../../src/rest/converters.js')
      >('../../../../src/rest/converters.js');
      return {
        ...actual,
        proxyEventToWebRequest: vi.fn(() => {
          throw new TypeError('Unexpected error');
        }),
      };
    });

    const { Router } = await import('../../../../src/rest/Router.js');
    const app = new Router();
    app.get('/test', () => ({ message: 'success' }));

    // Act & Assess
    await expect(
      app.resolve(createTestEvent('/test', 'GET'), context)
    ).rejects.toThrow('Unexpected error');
  });
});
