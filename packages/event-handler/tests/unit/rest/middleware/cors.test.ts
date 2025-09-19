import { beforeEach, describe, expect, it } from 'vitest';
import context from '@aws-lambda-powertools/testing-utils/context';
import { cors } from '../../../../src/rest/middleware/cors.js';
import { createTestEvent, createHeaderCheckMiddleware } from '../helpers.js';
import { Router } from '../../../../src/rest/Router.js';
import { DEFAULT_CORS_OPTIONS } from 'src/rest/constants.js';

describe('CORS Middleware', () => {
  const getRequestEvent = createTestEvent('/test', 'GET');
  const optionsRequestEvent = createTestEvent('/test', 'OPTIONS');
  let app: Router;

  const customCorsOptions = {
    origin: 'https://example.com',
    allowMethods: ['GET', 'POST'],
    allowHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
    exposeHeaders: ['Authorization', 'X-Custom-Header'],
    maxAge: 86400,
  };

  const expectedDefaultHeaders = {
    "access-control-allow-credentials": "false",
    "access-control-allow-headers": "Authorization, Content-Type, X-Amz-Date, X-Api-Key, X-Amz-Security-Token",
    "access-control-allow-methods": "DELETE, GET, HEAD, PATCH, POST, PUT",
    "access-control-allow-origin": "*",
  };

  beforeEach(() => {
    app = new Router();
    app.use(cors());
  });

  it('uses default configuration when no options are provided', async () => {
    // Prepare
    const corsHeaders: { [key: string]: string } = {};
    app.get('/test', [createHeaderCheckMiddleware(corsHeaders)], async () => ({ success: true }));

    // Act
    const result = await app.resolve(getRequestEvent, context);

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toEqual(DEFAULT_CORS_OPTIONS.origin);
    expect(result.multiValueHeaders?.['access-control-allow-methods']).toEqual(DEFAULT_CORS_OPTIONS.allowMethods);
    expect(result.multiValueHeaders?.['access-control-allow-headers']).toEqual(DEFAULT_CORS_OPTIONS.allowHeaders);
    expect(result.headers?.['access-control-allow-credentials']).toEqual(DEFAULT_CORS_OPTIONS.credentials.toString());
    expect(corsHeaders).toMatchObject(expectedDefaultHeaders);
  });

  it('merges user options with defaults', async () => {
    // Prepare
    const corsHeaders: { [key: string]: string } = {};
    const app = new Router();
    app.get('/test', [cors(customCorsOptions), createHeaderCheckMiddleware(corsHeaders)], async () => ({ success: true }));

    // Act
    const result = await app.resolve(getRequestEvent, context);

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toEqual('https://example.com');
    expect(result.multiValueHeaders?.['access-control-allow-methods']).toEqual(['GET', 'POST']);
    expect(result.multiValueHeaders?.['access-control-allow-headers']).toEqual(['Authorization', 'Content-Type']);
    expect(result.headers?.['access-control-allow-credentials']).toEqual('true');
    expect(result.multiValueHeaders?.['access-control-expose-headers']).toEqual(['Authorization', 'X-Custom-Header']);
    expect(result.headers?.['access-control-max-age']).toEqual('86400');
    expect(corsHeaders).toMatchObject({
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-allow-methods": "GET, POST",
      "access-control-allow-origin": "https://example.com",
    });
  });

  it.each([
    ['matching', 'https://app.com', 'https://app.com'],
    ['non-matching', 'https://non-matching.com', '']
  ])('handles array origin with %s request', async (_, origin, expected) => {
    // Prepare
    const app = new Router();
    app.get('/test', [cors({ origin: ['https://app.com', 'https://admin.app.com'] })], async () => ({ success: true }));

    // Act
    const result = await app.resolve(createTestEvent('/test', 'GET', { 'Origin': origin }), context);

    // Assess
    expect(result.headers?.['access-control-allow-origin']).toEqual(expected);
  });

  it('handles OPTIONS preflight requests', async () => {
    // Prepare
    app.options('/test', async () => ({ foo: 'bar' }));

    // Act
    const result = await app.resolve(createTestEvent('/test', 'OPTIONS', { 'Access-Control-Request-Method': 'GET' }), context);

    // Assess
    expect(result.statusCode).toBe(204);
  });

  it('calls the next middleware if the Access-Control-Request-Method is not present', async () => {
    // Prepare
    const corsHeaders: { [key: string]: string } = {};
    app.options('/test', [createHeaderCheckMiddleware(corsHeaders)], async () => ({ success: true }));

    // Act
    await app.resolve(optionsRequestEvent, context);

    // Assess
    expect(corsHeaders).toMatchObject(expectedDefaultHeaders);
  });
});
