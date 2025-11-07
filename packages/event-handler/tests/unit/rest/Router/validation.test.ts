import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { beforeEach, describe, expect, it } from 'vitest';
import { Router } from '../../../../src/rest/index.js';
import type { StandardSchema } from '../../../../src/types/rest.js';

// Mock schema helper
const createSchema = <T>(
  validator: (value: unknown) => boolean,
  returnValue?: T
): StandardSchema<unknown, T> => ({
  '~standard': {
    version: 1,
    vendor: 'test',
    validate: (value: unknown) => {
      if (validator(value)) {
        return { value: (returnValue ?? value) as T };
      }
      throw new Error('Validation failed');
    },
  },
});

// Mock event helper
const createMockEvent = (
  overrides?: Partial<APIGatewayProxyEvent>
): APIGatewayProxyEvent => {
  const httpMethod = overrides?.httpMethod || 'GET';
  const path = overrides?.path || '/test';

  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod,
    isBase64Encoded: false,
    path,
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: path,
    ...overrides,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      protocol: 'HTTP/1.1',
      httpMethod,
      path,
      stage: 'test',
      requestId: 'test-request-id',
      requestTime: '01/Jan/2024:00:00:00 +0000',
      requestTimeEpoch: 1704067200000,
      identity: {
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
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
        user: null,
        userArn: null,
      },
      authorizer: null,
      resourceId: 'test-resource',
      resourcePath: path,
      ...overrides?.requestContext,
    },
  };
};

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test',
  logStreamName: '2024/01/01/[$LATEST]test',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('Router Validation Integration', () => {
  let app: Router;

  beforeEach(() => {
    app = new Router();
  });

  describe('Request Body Validation', () => {
    it('validates request body successfully', async () => {
      const bodySchema = createSchema(
        (val) => typeof val === 'object' && val !== null && 'name' in val
      );

      app.post('/users', async () => ({ statusCode: 201, body: 'Created' }), {
        validation: { req: { body: bodySchema } },
      });

      const event = createMockEvent({
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json' },
        path: '/users',
        body: JSON.stringify({ name: 'John' }),
      });

      const result = await app.resolve(event, mockContext);
      expect(result.statusCode).toBe(201);
    });

    it('returns 422 on request body validation failure', async () => {
      const bodySchema = createSchema(() => false);

      app.post('/users', async () => ({ statusCode: 201, body: 'Created' }), {
        validation: { req: { body: bodySchema } },
      });

      const event = createMockEvent({
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json' },
        path: '/users',
        body: JSON.stringify({ invalid: 'data' }),
      });

      const result = await app.resolve(event, mockContext);
      expect(result.statusCode).toBe(422);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('RequestValidationError');
    });
  });

  describe('Request Headers Validation', () => {
    it('validates request headers successfully', async () => {
      const headerSchema = createSchema(() => true);

      app.get('/protected', async () => ({ statusCode: 200, body: 'OK' }), {
        validation: { req: { headers: headerSchema } },
      });

      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/protected',
        headers: { 'x-api-key': 'test-key' },
      });

      const result = await app.resolve(event, mockContext);
      expect(result.statusCode).toBe(200);
    });

    it('returns 422 on request headers validation failure', async () => {
      const headerSchema = createSchema(() => false);

      app.get('/protected', async () => ({ statusCode: 200, body: 'OK' }), {
        validation: { req: { headers: headerSchema } },
      });

      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/protected',
        headers: {},
      });

      const result = await app.resolve(event, mockContext);
      expect(result.statusCode).toBe(422);
    });
  });

  describe('Request Path Parameters Validation', () => {
    it('validates path parameters successfully', async () => {
      const pathSchema = createSchema(
        (val) => typeof val === 'object' && val !== null && 'id' in val
      );

      app.get(
        '/users/:id',
        async (reqCtx) => ({ body: { id: reqCtx.params.id } }),
        {
          validation: { req: { path: pathSchema } },
        }
      );

      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/users/123',
        pathParameters: { id: '123' },
      });

      const result = await app.resolve(event, mockContext);
      expect(result.statusCode).toBe(200);
    });

    it('returns 422 on path parameters validation failure', async () => {
      const pathSchema = createSchema(() => false);

      app.get('/users/:id', async () => ({ body: { id: '123' } }), {
        validation: { req: { path: pathSchema } },
      });

      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/users/123',
        pathParameters: { id: '123' },
      });

      const result = await app.resolve(event, mockContext);
      expect(result.statusCode).toBe(422);
    });
  });

  describe('Request Query Parameters Validation', () => {
    it('validates query parameters successfully', async () => {
      const querySchema = createSchema(() => true);

      app.get('/users', async () => ({ body: { users: [] } }), {
        validation: { req: { query: querySchema } },
      });

      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/users',
        queryStringParameters: { page: '1', limit: '10' },
      });

      const result = await app.resolve(event, mockContext);
      expect(result.statusCode).toBe(200);
    });

    it('returns 422 on query parameters validation failure', async () => {
      const querySchema = createSchema(() => false);

      app.get('/users', async () => ({ body: { users: [] } }), {
        validation: { req: { query: querySchema } },
      });

      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/users',
        queryStringParameters: { page: '1' },
      });

      const result = await app.resolve(event, mockContext);
      expect(result.statusCode).toBe(422);
    });
  });

  describe('Response Body Validation', () => {
    it('validates response body successfully', async () => {
      const responseSchema = createSchema(
        (val) => typeof val === 'object' && val !== null && 'id' in val
      );

      app.get(
        '/users/:id',
        async () => ({ body: { id: '123', name: 'John' } }),
        {
          validation: { res: { body: responseSchema } },
        }
      );

      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/users/123',
        pathParameters: { id: '123' },
      });

      const result = await app.resolve(event, mockContext);
      expect(result.statusCode).toBe(200);
    });

    it.todo('returns 500 on response body validation failure', async () => {
      const responseSchema = createSchema(() => false);

      app.get(
        '/users/:id',
        async () => ({ statusCode: 200, body: { id: '123' } }),
        {
          validation: { res: { body: responseSchema } },
        }
      );

      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/users/123',
        pathParameters: { id: '123' },
      });

      const result = await app.resolve(event, mockContext);
      expect(result.statusCode).toBe(500);
    });
  });

  describe('Combined Request and Response Validation', () => {
    it('validates both request and response', async () => {
      const requestSchema = createSchema(
        (val) => typeof val === 'object' && val !== null && 'name' in val
      );
      const responseSchema = createSchema(
        (val) => typeof val === 'object' && val !== null && 'id' in val
      );

      app.post('/users', async () => ({ body: { id: '123', name: 'John' } }), {
        validation: {
          req: { body: requestSchema },
          res: { body: responseSchema },
        },
      });

      const event = createMockEvent({
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json' },
        path: '/users',
        body: JSON.stringify({ name: 'John' }),
      });

      const result = await app.resolve(event, mockContext);
      expect(result.statusCode).toBe(200);
    });
  });

  describe('Multiple Routes with Different Validation', () => {
    it('applies validation only to configured routes', async () => {
      const bodySchema = createSchema(() => false);

      app.post('/validated', async () => ({ statusCode: 201 }), {
        validation: { req: { body: bodySchema } },
      });

      app.post('/unvalidated', async () => ({ statusCode: 201 }));

      const validatedEvent = createMockEvent({
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json' },
        path: '/validated',
        body: JSON.stringify({ data: 'test' }),
      });

      const unvalidatedEvent = createMockEvent({
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json' },
        path: '/unvalidated',
        body: JSON.stringify({ data: 'test' }),
      });

      const validatedResult = await app.resolve(validatedEvent, mockContext);
      expect(validatedResult.statusCode).toBe(422);

      const unvalidatedResult = await app.resolve(
        unvalidatedEvent,
        mockContext
      );
      expect(unvalidatedResult.statusCode).toBe(200);
    });
  });
});
