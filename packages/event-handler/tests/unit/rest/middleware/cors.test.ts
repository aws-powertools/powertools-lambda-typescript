import { beforeEach, describe, expect, it } from 'vitest';
import context from '@aws-lambda-powertools/testing-utils/context';
import { cors } from '../../../../src/rest/middleware/cors.js';
import { createTestEvent, createTrackingMiddleware } from '../helpers.js';
import { Router } from '../../../../src/rest/Router.js';
import { DEFAULT_CORS_OPTIONS } from 'src/rest/constants.js';

describe('CORS Middleware', () => {
  const getRequestEvent = createTestEvent('/test', 'GET');
  const optionsRequestEvent = createTestEvent('/test', 'OPTIONS');
  let app: Router;

  beforeEach(() => {
    app = new Router();
    app.use(cors());
  });

  it('uses default configuration when no options are provided', async () => {
    // Prepare
    const executionOrder: string[] = [];
    app.get(
      '/test',
      [createTrackingMiddleware('middleware1', executionOrder)],
      async () => {
        executionOrder.push('handler');
        return { success: true };
      });

    // Act
    const result = await app.resolve(getRequestEvent, context);

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toEqual(DEFAULT_CORS_OPTIONS.origin);
    expect(result.multiValueHeaders?.['access-control-allow-methods']).toEqual(
      DEFAULT_CORS_OPTIONS.allowMethods
    );
    expect(result.multiValueHeaders?.['access-control-allow-headers']).toEqual(
      DEFAULT_CORS_OPTIONS.allowHeaders
    );
    expect(result.headers?.['access-control-allow-credentials']).toEqual(
      DEFAULT_CORS_OPTIONS.credentials.toString()
    );
    expect(executionOrder).toEqual([
      'middleware1-start',
      'handler',
      'middleware1-end',
    ]);
  });

  it('merges user options with defaults', async () => {
    // Prepare
    const executionOrder: string[] = [];
    const application = new Router();
    application.get(
      '/test',
      [
        cors({
          origin: 'https://example.com',
          allowMethods: ['GET', 'POST'],
          allowHeaders: ['Authorization', 'Content-Type'],
          credentials: true,
          exposeHeaders: ['Authorization', 'X-Custom-Header'],
          maxAge: 86400,
        }),
        createTrackingMiddleware('middleware1', executionOrder)
      ],
      async () => {
        executionOrder.push('handler');
        return { success: true };
      });

    // Act
    const result = await application.resolve(getRequestEvent, context);

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toEqual('https://example.com');
    expect(result.multiValueHeaders?.['access-control-allow-methods']).toEqual(
      ['GET', 'POST']
    );
    expect(result.multiValueHeaders?.['access-control-allow-headers']).toEqual(
      ['Authorization', 'Content-Type']
    );
    expect(result.headers?.['access-control-allow-credentials']).toEqual(
      'true'
    );
    expect(result.multiValueHeaders?.['access-control-expose-headers']).toEqual(
      ['Authorization', 'X-Custom-Header']
    );
    expect(result.headers?.['access-control-max-age']).toEqual(
      '86400'
    );
    expect(executionOrder).toEqual([
      'middleware1-start',
      'handler',
      'middleware1-end',
    ]);
  });

  it('handles array origin with matching request', async () => {
    // Prepare
    const allowedOrigins = ['https://app.com', 'https://admin.app.com'];
    const application = new Router();
    application.get(
      '/test',
      [
        cors({
          origin: allowedOrigins,
          allowMethods: ['GET', 'POST'],
          allowHeaders: ['Authorization', 'Content-Type'],
          credentials: true,
          exposeHeaders: ['Authorization', 'X-Custom-Header'],
          maxAge: 86400,
        }),
      ],
      async () => {
        return { success: true };
      });

    // Act
    const result = await application.resolve(createTestEvent('/test', 'GET', {
      'Origin': 'https://app.com'
    }), context);

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toEqual('https://app.com');
  });

  it('handles array origin with non-matching request', async () => {
    // Prepare
    const allowedOrigins = ['https://app.com', 'https://admin.app.com'];
    const application = new Router();
    application.get(
      '/test',
      [
        cors({
          origin: allowedOrigins,
          allowMethods: ['GET', 'POST'],
          allowHeaders: ['Authorization', 'Content-Type'],
          credentials: true,
          exposeHeaders: ['Authorization', 'X-Custom-Header'],
          maxAge: 86400,
        }),
      ],
      async () => {
        return { success: true };
      });

    // Act
    const result = await application.resolve(createTestEvent('/test', 'GET', {
      'Origin': 'https://non-matching.com'
    }), context);

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toEqual('');
  });

  it('handles OPTIONS preflight requests', async () => {
    // Prepare
    app.options(
      '/test',
      async () => {
        return { foo: 'bar' };
      });

    // Act
    const result = await app.resolve(createTestEvent('/test', 'OPTIONS', {
      'Access-Control-Request-Method': 'GET'
    }), context);

    // Assess
    expect(result.statusCode).toBe(204);
  });

  it('calls the next middleware if the Access-Control-Request-Method is not present', async () => {
    // Prepare
    const executionOrder: string[] = [];
    app.options(
      '/test',
      [createTrackingMiddleware('middleware1', executionOrder)],
      async () => {
        executionOrder.push('handler');
        return { success: true };
      });

    // Act
    await app.resolve(optionsRequestEvent, context);

    // Assess
    expect(executionOrder).toEqual([
      'middleware1-start',
      'handler',
      'middleware1-end',
    ]);
  });
});
