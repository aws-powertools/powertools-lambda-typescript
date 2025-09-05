import type { APIGatewayProxyEvent } from 'aws-lambda';
import type { Middleware } from '../../../src/types/rest.js';

export const createTestEvent = (
  path: string,
  httpMethod: string
): APIGatewayProxyEvent => ({
  path,
  httpMethod,
  headers: {},
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
  return async (_params, _options, next) => {
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
  return async (_params, _options, _next) => {
    executionOrder.push(name);
    throw new Error(errorMessage);
  };
};

export const createReturningMiddleware = (
  name: string,
  executionOrder: string[],
  response: any
): Middleware => {
  return async (_params, _options, _next) => {
    executionOrder.push(name);
    return response;
  };
};

export const createNoNextMiddleware = (
  name: string,
  executionOrder: string[]
): Middleware => {
  return async (_params, _options, _next) => {
    executionOrder.push(name);
    // Intentionally doesn't call next()
  };
};
