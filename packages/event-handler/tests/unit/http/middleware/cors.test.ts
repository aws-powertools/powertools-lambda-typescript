import context from '@aws-lambda-powertools/testing-utils/context';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CORS_OPTIONS } from '../../../../src/http/constants.js';
import { cors } from '../../../../src/http/middleware/cors.js';
import { Router } from '../../../../src/http/Router.js';
import { createHeaderCheckMiddleware, createTestEvent } from '../helpers.js';

describe('CORS Middleware', () => {
  const origin = 'https://example.com';
  const getRequestEvent = createTestEvent('/test', 'GET', {
    Origin: origin,
  });
  let app: Router;

  beforeEach(() => {
    app = new Router();
    app.use(cors());
  });

  it('does not set CORS headers when request has no origin header', async () => {
    // Prepare
    app.get('/test', async () => ({ success: true }));

    // Act
    const result = await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toBeUndefined();
  });

  it('does not set CORS headers when request origin does not match with allowed origin', async () => {
    // Prepare
    const app = new Router();
    app.get(
      '/test',
      [
        cors({
          origin: 'https://another-origin.com',
        }),
      ],
      async () => ({ success: true })
    );

    // Act
    const result = await app.resolve(getRequestEvent, context);

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toBeUndefined();
  });

  it('uses default CORS configuration when no options are provided', async () => {
    // Prepare
    const corsHeaders: { [key: string]: string } = {};
    app.get('/test', [createHeaderCheckMiddleware(corsHeaders)], async () => ({
      success: true,
    }));

    // Act
    const result = await app.resolve(getRequestEvent, context);

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toEqual(
      DEFAULT_CORS_OPTIONS.origin
    );
    expect(corsHeaders['access-control-allow-origin']).toEqual(
      DEFAULT_CORS_OPTIONS.origin
    );
  });

  it('uses custom CORS configuration when provided', async () => {
    // Prepare
    const corsHeaders: { [key: string]: string } = {};
    const app = new Router();
    const customConfig = {
      origin,
      credentials: true,
      exposeHeaders: ['Authorization', 'X-Custom-Header'],
    };
    app.get(
      '/test',
      [cors(customConfig), createHeaderCheckMiddleware(corsHeaders)],
      async () => ({ success: true })
    );

    // Act
    const result = await app.resolve(getRequestEvent, context);

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toEqual(origin);
    expect(result.headers?.['access-control-allow-credentials']).toEqual(
      customConfig.credentials.toString()
    );
    expect(result.multiValueHeaders?.['access-control-expose-headers']).toEqual(
      customConfig.exposeHeaders
    );
    expect(corsHeaders['access-control-allow-origin']).toEqual(origin);
    expect(corsHeaders['access-control-allow-credentials']).toEqual(
      customConfig.credentials.toString()
    );
    expect(corsHeaders['access-control-expose-headers']).toEqual(
      customConfig.exposeHeaders.join(', ')
    );
  });

  it('sets the vary header if the response is dynamic based on origin', async () => {
    // Prepare
    const app = new Router();
    app.get(
      '/test',
      [
        cors({
          origin: ['https://example.com', 'https://another-example.com'],
        }),
      ],
      async () => ({ success: true })
    );

    // Act
    const result = await app.resolve(getRequestEvent, context);

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toEqual(origin);
    expect(result.headers?.vary).toEqual('Origin');
  });

  it('does not set CORS headers when preflight request method does not match allowed method', async () => {
    // Prepare
    const app = new Router();
    app.use(
      cors({
        allowMethods: ['POST'],
      })
    );

    // Act
    const result = await app.resolve(
      createTestEvent('/test', 'OPTIONS', {
        Origin: origin,
        'Access-Control-Request-Method': 'GET',
      }),
      context
    );

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toBeUndefined();
  });

  it('does not set CORS headers when preflight request header does not match allowed header', async () => {
    // Prepare
    const app = new Router();
    app.use(
      cors({
        allowHeaders: ['Content-Type'],
      })
    );

    // Act
    const result = await app.resolve(
      createTestEvent('/test', 'OPTIONS', {
        Origin: origin,
        'Access-Control-Request-Header': 'x-test-header',
      }),
      context
    );

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toBeUndefined();
  });

  it('handles OPTIONS preflight requests', async () => {
    // Prepare
    const app = new Router();
    const corsConfig = {
      origin,
      allowMethods: ['GET', 'POST'],
      allowHeaders: ['Authorization', 'Content-Type'],
      maxAge: 3600,
    };
    app.use(cors(corsConfig));

    // Act
    const result = await app.resolve(
      createTestEvent('/test', 'OPTIONS', {
        Origin: origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization',
      }),
      context
    );

    // Assess
    expect(result.statusCode).toBe(204);
    expect(result.headers?.['access-control-allow-origin']).toEqual(
      corsConfig.origin
    );
    expect(result.multiValueHeaders?.['access-control-allow-methods']).toEqual(
      corsConfig.allowMethods
    );
    expect(result.multiValueHeaders?.['access-control-allow-headers']).toEqual(
      corsConfig.allowHeaders.map((header) => header.toLowerCase())
    );
    expect(result.headers?.['access-control-max-age']).toEqual(
      corsConfig.maxAge.toString()
    );
  });
});
