import type { APIGatewayProxyEvent } from 'aws-lambda';

const createTestEvent = (options: {
  path: string;
  httpMethod: string;
  headers?: Record<string, string>;
}): APIGatewayProxyEvent => ({
  path: options.path,
  httpMethod: options.httpMethod,
  headers: options.headers ?? {},
  body: null,
  multiValueHeaders: {},
  isBase64Encoded: false,
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {
    httpMethod: options.httpMethod,
    path: options.path,
    domainName: 'localhost',
  } as APIGatewayProxyEvent['requestContext'],
  resource: '',
});

export { createTestEvent };
