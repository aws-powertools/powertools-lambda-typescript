/**
 * Test for CORS middleware
 *
 * @group unit/event-handler/rest/middleware/cors
 */

import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';
import type { RequestContext } from '../../../../src/types/rest.js';
import { cors } from '../../../../src/rest/middleware/cors.js';
import type { CorsOptions } from '../../../../src/rest/middleware/cors.js';

// Mock context
const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2021/01/01/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

// Test utilities
function createMockAPIGatewayEvent(
  method: string,
  headers: Record<string, string> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: method,
    path: '/test',
    resource: '/test',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    headers,
    multiValueHeaders: {},
    body: null,
    isBase64Encoded: false,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      protocol: 'HTTP/1.1',
      httpMethod: method,
      path: '/test',
      stage: 'test',
      requestId: 'test-request-id',
      requestTime: '09/Apr/2015:12:34:56 +0000',
      requestTimeEpoch: 1428582896000,
      authorizer: {},
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'Custom User Agent String',
        userArn: null,
      },
      resourceId: 'test-resource',
      resourcePath: '/test',
    },
  };
}

function createMockRequestContext(
  method: string,
  origin?: string
): RequestContext {
  const headers = new Headers();
  if (origin) {
    headers.set('Origin', origin);
  }

  const request = new Request('https://example.com/test', {
    method,
    headers,
  });

  const response = new Response('', { status: 200 });

  return {
    request,
    res: response,
    event: createMockAPIGatewayEvent(method, origin ? { Origin: origin } : {}),
    context: mockContext,
  };
}

describe('CORS Configuration', () => {
  it('should use default configuration when no options provided', async () => {
    const middleware = cors();
    const reqCtx = createMockRequestContext('GET');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should merge user options with defaults', async () => {
    const options: CorsOptions = {
      origin: 'https://example.com',
      credentials: true,
    };

    const middleware = cors(options);
    const reqCtx = createMockRequestContext('GET');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
    expect(reqCtx.res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should handle expose headers configuration', async () => {
    const options: CorsOptions = {
      exposeHeaders: ['Content-Length', 'X-Custom-Header'],
    };

    const middleware = cors(options);
    const reqCtx = createMockRequestContext('GET');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Expose-Headers')).toBe(
      'Content-Length, X-Custom-Header'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('Origin Resolution', () => {
  it('should handle string origin', async () => {
    const middleware = cors({ origin: 'https://example.com' });
    const reqCtx = createMockRequestContext('GET');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should handle array origin with matching request', async () => {
    const allowedOrigins = ['https://app.com', 'https://admin.app.com'];
    const middleware = cors({ origin: allowedOrigins });
    const reqCtx = createMockRequestContext('GET', 'https://app.com');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Allow-Origin')).toBe('https://app.com');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should handle array origin with non-matching request', async () => {
    const allowedOrigins = ['https://app.com', 'https://admin.app.com'];
    const middleware = cors({ origin: allowedOrigins });
    const reqCtx = createMockRequestContext('GET', 'https://evil.com');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should handle function origin returning string', async () => {
    const originFn = (origin: string | undefined) => {
      return origin === 'https://trusted.com' ? 'https://trusted.com' : '';
    };

    const middleware = cors({ origin: originFn });
    const reqCtx = createMockRequestContext('GET', 'https://trusted.com');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Allow-Origin')).toBe('https://trusted.com');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should handle function origin returning boolean true', async () => {
    const originFn = (origin: string | undefined) => {
      return origin === 'https://trusted.com';
    };

    const middleware = cors({ origin: originFn });
    const reqCtx = createMockRequestContext('GET', 'https://trusted.com');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Allow-Origin')).toBe('https://trusted.com');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should handle function origin returning boolean false', async () => {
    const originFn = (origin: string | undefined) => {
      return origin === 'https://trusted.com';
    };

    const middleware = cors({ origin: originFn });
    const reqCtx = createMockRequestContext('GET', 'https://untrusted.com');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should handle missing request origin header', async () => {
    const middleware = cors();
    const reqCtx = createMockRequestContext('GET'); // No origin header
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('OPTIONS Preflight Handling', () => {
  it('should return 204 for OPTIONS request with CORS enabled', async () => {
    const middleware = cors();
    const reqCtx = createMockRequestContext('OPTIONS');
    const next = vi.fn().mockResolvedValue(undefined);

    const result = await middleware({}, reqCtx, next);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(204);
    expect(next).not.toHaveBeenCalled();
  });

  it('should include Access-Control-Allow-Origin header in preflight', async () => {
    const middleware = cors({ origin: 'https://example.com' });
    const reqCtx = createMockRequestContext('OPTIONS', 'https://example.com');
    const next = vi.fn().mockResolvedValue(undefined);

    const result = (await middleware({}, reqCtx, next)) as Response;

    expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
    expect(next).not.toHaveBeenCalled();
  });

  it('should include Access-Control-Allow-Methods header in preflight', async () => {
    const methods = ['GET', 'POST', 'PUT'];
    const middleware = cors({ allowMethods: methods });
    const reqCtx = createMockRequestContext('OPTIONS');
    const next = vi.fn().mockResolvedValue(undefined);

    const result = (await middleware({}, reqCtx, next)) as Response;

    expect(result.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT');
    expect(next).not.toHaveBeenCalled();
  });

  it('should include Access-Control-Allow-Headers header in preflight', async () => {
    const headers = ['Content-Type', 'Authorization'];
    const middleware = cors({ allowHeaders: headers });
    const reqCtx = createMockRequestContext('OPTIONS');
    const next = vi.fn().mockResolvedValue(undefined);

    const result = (await middleware({}, reqCtx, next)) as Response;

    expect(result.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    expect(next).not.toHaveBeenCalled();
  });

  it('should include Access-Control-Max-Age when configured', async () => {
    const middleware = cors({ maxAge: 3600 });
    const reqCtx = createMockRequestContext('OPTIONS');
    const next = vi.fn().mockResolvedValue(undefined);

    const result = (await middleware({}, reqCtx, next)) as Response;

    expect(result.headers.get('Access-Control-Max-Age')).toBe('3600');
    expect(next).not.toHaveBeenCalled();
  });

  it('should include Access-Control-Allow-Credentials when true', async () => {
    const middleware = cors({ credentials: true });
    const reqCtx = createMockRequestContext('OPTIONS');
    const next = vi.fn().mockResolvedValue(undefined);

    const result = (await middleware({}, reqCtx, next)) as Response;

    expect(result.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(next).not.toHaveBeenCalled();
  });

  it('should not call next() for OPTIONS requests', async () => {
    const middleware = cors();
    const reqCtx = createMockRequestContext('OPTIONS');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(next).not.toHaveBeenCalled();
  });
});

describe('Regular Request Handling', () => {
  it('should add CORS headers to existing response', async () => {
    const middleware = cors();
    const reqCtx = createMockRequestContext('GET');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should call next() for non-OPTIONS requests', async () => {
    const middleware = cors();
    const reqCtx = createMockRequestContext('GET');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should preserve existing response headers', async () => {
    const middleware = cors();
    const reqCtx = createMockRequestContext('GET');
    reqCtx.res.headers.set('X-Custom-Header', 'custom-value');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(reqCtx.res.headers.get('X-Custom-Header')).toBe('custom-value');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should handle missing Origin header gracefully', async () => {
    const middleware = cors({ origin: ['https://allowed.com'] });
    const reqCtx = createMockRequestContext('GET'); // No origin
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should add Access-Control-Expose-Headers when configured', async () => {
    const middleware = cors({ exposeHeaders: ['X-Total-Count'] });
    const reqCtx = createMockRequestContext('GET');
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({}, reqCtx, next);

    expect(reqCtx.res.headers.get('Access-Control-Expose-Headers')).toBe('X-Total-Count');
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('Python Implementation Parity', () => {
  it('should match Python default configuration', async () => {
    const middleware = cors();
    const reqCtx = createMockRequestContext('OPTIONS');
    const next = vi.fn().mockResolvedValue(undefined);

    const result = (await middleware({}, reqCtx, next)) as Response;

    // Verify default values match Python implementation
    expect(result.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(result.headers.get('Access-Control-Allow-Methods')).toBe(
      'DELETE, GET, HEAD, PATCH, POST, PUT'
    );
    expect(result.headers.get('Access-Control-Allow-Headers')).toBe(
      'Authorization, Content-Type, X-Amz-Date, X-Api-Key, X-Amz-Security-Token'
    );
    expect(result.headers.get('Access-Control-Allow-Credentials')).toBeNull();
    expect(next).not.toHaveBeenCalled();
  });
});