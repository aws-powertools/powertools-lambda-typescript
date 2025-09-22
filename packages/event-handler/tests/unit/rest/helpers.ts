import type { APIGatewayProxyEvent } from 'aws-lambda';
import type { Middleware } from '../../../src/types/rest.js';

export const createTestEvent = (
  path: string,
  httpMethod: string,
  headers: Record<string, string> = {}
): APIGatewayProxyEvent => ({
  path,
  httpMethod,
  headers,
  body: null,
  multiValueHeaders: {},
  isBase64Encoded: false,
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {
    httpMethod,
    path,
    domainName: 'localhost',
  } as any,
  resource: '',
});

export const createTrackingMiddleware = (
  name: string,
  executionOrder: string[]
): Middleware => {
  return async ({ next }) => {
    executionOrder.push(`${name}-start`);
    await next();
    executionOrder.push(`${name}-end`);
  };
};

export const createThrowingMiddleware = (
  name: string,
  executionOrder: string[],
  errorMessage: string
): Middleware => {
  return async () => {
    executionOrder.push(name);
    throw new Error(errorMessage);
  };
};

export const createReturningMiddleware = (
  name: string,
  executionOrder: string[],
  response: any
): Middleware => {
  return async () => {
    executionOrder.push(name);
    return response;
  };
};

export const createNoNextMiddleware = (
  name: string,
  executionOrder: string[]
): Middleware => {
  return async () => {
    executionOrder.push(name);
    // Intentionally doesn't call next()
  };
};

export const createSettingHeadersMiddleware = (headers: {
  [key: string]: string;
}): Middleware => {
  return async ({ reqCtx, next }) => {
    await next();
    Object.entries(headers).forEach(([key, value]) => {
      reqCtx.res.headers.set(key, value);
    });
  };
};

export const createHeaderCheckMiddleware = (headers: {
  [key: string]: string;
}): Middleware => {
  return async ({ reqCtx, next }) => {
    reqCtx.res.headers.forEach((value, key) => {
      headers[key] = value;
    });
    await next();
  };
};
