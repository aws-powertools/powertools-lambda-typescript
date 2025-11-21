import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  composeMiddleware,
  isALBEvent,
  isAPIGatewayProxyEventV1,
  isAPIGatewayProxyEventV2,
  isExtendedAPIGatewayProxyResult,
} from '../../../src/http/index.js';
import {
  compilePath,
  resolvePrefixedPath,
  validatePathPattern,
} from '../../../src/http/utils.js';
import type {
  Middleware,
  Path,
  RequestContext,
} from '../../../src/types/http.js';

describe('Path Utilities', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  describe('validatePathPattern', () => {
    it.each([
      { path: '/users/:id', expected: true, issues: [] },
      { path: '/users/:user_id/posts/:post_id', expected: true, issues: [] },
      { path: '/static/path', expected: true, issues: [] },
      { path: '/:param1/:param2/:param3', expected: true, issues: [] },
      {
        path: '/users/:id:',
        expected: false,
        issues: ['Malformed parameter syntax. Use :paramName format.'],
      },
      {
        path: '/users/:id/:id',
        expected: false,
        issues: ['Duplicate parameter names: id'],
      },
      {
        path: '/:param/:param/:param%',
        expected: false,
        issues: [
          'Malformed parameter syntax. Use :paramName format.',
          'Duplicate parameter names: param',
        ],
      },
      {
        path: '/users/:id#',
        expected: false,
        issues: ['Malformed parameter syntax. Use :paramName format.'],
      },
      {
        path: '/users/:12345id',
        expected: false,
        issues: ['Malformed parameter syntax. Use :paramName format.'],
      },
      {
        path: '/users/:',
        expected: false,
        issues: ['Malformed parameter syntax. Use :paramName format.'],
      },
      {
        path: '/users/:id/posts/:id',
        expected: false,
        issues: ['Duplicate parameter names: id'],
      },
      {
        path: '/users/:name/:age/:name',
        expected: false,
        issues: ['Duplicate parameter names: name'],
      },
      {
        path: '/users/:id:name',
        expected: false,
        issues: ['Malformed parameter syntax. Use :paramName format.'],
      },
      {
        path: '/users/:id/posts/:name^',
        expected: false,
        issues: ['Malformed parameter syntax. Use :paramName format.'],
      },
      {
        path: '/post/:id#comment',
        expected: false,
        issues: ['Malformed parameter syntax. Use :paramName format.'],
      },
    ])(
      'should validate path "$path" correctly',
      ({ path, expected, issues }) => {
        // Act
        const result = validatePathPattern(path as Path);

        // Assert
        expect(result.isValid).toBe(expected);
        expect(result.issues).toEqual(issues);
      }
    );
  });

  describe('compilePath', () => {
    it.each([
      {
        path: '/users/:id',
        expectedParams: ['id'],
        testMatches: [
          { url: '/users/123', shouldMatch: true, params: { id: '123' } },
          { url: '/users/abc', shouldMatch: true, params: { id: 'abc' } },
          { url: '/users/123/posts', shouldMatch: false, params: {} },
          { url: '/users', shouldMatch: false, params: {} },
        ],
      },
      {
        path: '/users/:userId/posts/:postId',
        expectedParams: ['userId', 'postId'],
        testMatches: [
          {
            url: '/users/123/posts/456',
            shouldMatch: true,
            params: { userId: '123', postId: '456' },
          },
          {
            url: '/users/abc/posts/def',
            shouldMatch: true,
            params: { userId: 'abc', postId: 'def' },
          },
          { url: '/users/123/posts', shouldMatch: false, params: {} },
          { url: '/users/123', shouldMatch: false, params: {} },
        ],
      },
      {
        path: '/static/path',
        expectedParams: [],
        testMatches: [
          { url: '/static/path', shouldMatch: true, params: {} },
          { url: '/static/other', shouldMatch: false, params: {} },
          { url: '/static/path/extra', shouldMatch: false, params: {} },
        ],
      },
      {
        path: '/:param1/:param2/:param3',
        expectedParams: ['param1', 'param2', 'param3'],
        testMatches: [
          {
            url: '/a/b/c',
            shouldMatch: true,
            params: { param1: 'a', param2: 'b', param3: 'c' },
          },
          {
            url: '/123/456/789',
            shouldMatch: true,
            params: { param1: '123', param2: '456', param3: '789' },
          },
          { url: '/a/b', shouldMatch: false, params: {} },
          { url: '/a/b/c/d', shouldMatch: false, params: {} },
        ],
      },
      {
        path: '/users/:id/profile',
        expectedParams: ['id'],
        testMatches: [
          {
            url: '/users/123/profile',
            shouldMatch: true,
            params: { id: '123' },
          },
          {
            url: '/users/abc/profile',
            shouldMatch: true,
            params: { id: 'abc' },
          },
          { url: '/users/profile', shouldMatch: false, params: {} },
          { url: '/users/123/settings', shouldMatch: false, params: {} },
        ],
      },
      {
        path: '/api/:version/users/:userId',
        expectedParams: ['version', 'userId'],
        testMatches: [
          {
            url: '/api/v1/users/123',
            shouldMatch: true,
            params: { version: 'v1', userId: '123' },
          },
          {
            url: '/api/v2/users/abc',
            shouldMatch: true,
            params: { version: 'v2', userId: 'abc' },
          },
          { url: '/api/users/123', shouldMatch: false, params: {} },
          { url: '/api/v1/users', shouldMatch: false, params: {} },
        ],
      },
    ])(
      'should compile path "$path" correctly',
      ({ path, expectedParams, testMatches }) => {
        // Act
        const compiled = compilePath(path as Path);

        // Assert
        expect(compiled.path).toBe(path);
        expect(compiled.paramNames).toEqual(expectedParams);
        expect(compiled.isDynamic).toBe(expectedParams.length > 0);

        // Test regex matching
        for (const testCase of testMatches) {
          if (testCase.shouldMatch) {
            expect(testCase.url).toMatch(compiled.regex);

            // Test extracted parameters
            const match = compiled.regex.exec(testCase.url);
            if (match?.groups) {
              expect(match.groups).toEqual(testCase.params);
            }
          } else {
            expect(testCase.url).not.toMatch(compiled.regex);
          }
        }
      }
    );
  });

  describe('isAPIGatewayProxyEventV1', () => {
    const baseValidEvent = {
      httpMethod: 'GET',
      path: '/test',
      resource: '/test',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: {},
      multiValueQueryStringParameters: {},
      pathParameters: {},
      stageVariables: {},
      requestContext: { stage: 'test' },
      isBase64Encoded: false,
      body: null,
    };

    it('should return true for valid API Gateway Proxy event with all fields populated', () => {
      expect(isAPIGatewayProxyEventV1(baseValidEvent)).toBe(true);
    });

    it('should return true for real API Gateway event with null fields', () => {
      const realEvent = {
        resource: '/{proxy+}',
        path: '/test',
        httpMethod: 'GET',
        headers: null,
        multiValueHeaders: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: { proxy: 'test' },
        stageVariables: null,
        requestContext: {
          resourceId: 'ovdb9g',
          resourcePath: '/{proxy+}',
          httpMethod: 'GET',
          stage: 'test-invoke-stage',
          requestId: 'eecdfcfa-225a-4ee3-bdca-05fc31b6018a',
          identity: { sourceIp: 'test-invoke-source-ip' },
        },
        body: null,
        isBase64Encoded: false,
      };

      expect(isAPIGatewayProxyEventV1(realEvent)).toBe(true);
    });

    it('should return true for event with string body', () => {
      const eventWithBody = {
        ...baseValidEvent,
        httpMethod: 'POST',
        body: '{"key":"value"}',
      };

      expect(isAPIGatewayProxyEventV1(eventWithBody)).toBe(true);
    });

    it.each([
      // Headers can be null in reality (even though types say otherwise)
      { field: 'headers', value: null },
      { field: 'headers', value: undefined },
      { field: 'multiValueHeaders', value: null },
      { field: 'multiValueHeaders', value: undefined },
      // These are officially nullable in the type definition
      { field: 'body', value: null },
      { field: 'pathParameters', value: null },
      { field: 'queryStringParameters', value: null },
      { field: 'multiValueQueryStringParameters', value: null },
      { field: 'stageVariables', value: null },
    ])('should return true when $field is $value', ({ field, value }) => {
      const event = { ...baseValidEvent, [field]: value };
      expect(isAPIGatewayProxyEventV1(event)).toBe(true);
    });

    it.each([
      {
        field: 'headers',
        value: { 'content-type': undefined, 'x-api-key': 'test' },
      },
      {
        field: 'multiValueHeaders',
        value: { accept: undefined, 'x-custom': ['val1', 'val2'] },
      },
      { field: 'pathParameters', value: { id: undefined, name: 'test' } },
      {
        field: 'queryStringParameters',
        value: { filter: undefined, sort: 'asc' },
      },
      {
        field: 'multiValueQueryStringParameters',
        value: { tags: undefined, categories: ['a', 'b'] },
      },
      { field: 'stageVariables', value: { env: undefined, version: 'v1' } },
    ])(
      'should return true when $field contains undefined values',
      ({ field, value }) => {
        const event = { ...baseValidEvent, [field]: value };
        expect(isAPIGatewayProxyEventV1(event)).toBe(true);
      }
    );

    it.each([
      { case: 'null', event: null },
      { case: 'undefined', event: undefined },
      { case: 'string', event: 'not an object' },
      { case: 'number', event: 123 },
      { case: 'array', event: [] },
    ])('should return false for $case', ({ event }) => {
      expect(isAPIGatewayProxyEventV1(event)).toBe(false);
    });

    it.each([
      { field: 'httpMethod', value: 123 },
      { field: 'httpMethod', value: null },
      { field: 'httpMethod', value: undefined },
      { field: 'path', value: 123 },
      { field: 'path', value: null },
      { field: 'path', value: undefined },
      { field: 'resource', value: 123 },
      { field: 'resource', value: null },
      { field: 'resource', value: undefined },
      { field: 'headers', value: 'not an object' },
      { field: 'headers', value: 123 },
      { field: 'multiValueHeaders', value: 'not an object' },
      { field: 'multiValueHeaders', value: 123 },
      { field: 'queryStringParameters', value: 'not an object' },
      { field: 'queryStringParameters', value: 123 },
      { field: 'multiValueQueryStringParameters', value: 'not an object' },
      { field: 'multiValueQueryStringParameters', value: 123 },
      { field: 'pathParameters', value: 'not an object' },
      { field: 'pathParameters', value: 123 },
      { field: 'stageVariables', value: 'not an object' },
      { field: 'stageVariables', value: 123 },
      { field: 'requestContext', value: 'not an object' },
      { field: 'requestContext', value: null },
      { field: 'requestContext', value: undefined },
      { field: 'requestContext', value: 123 },
      { field: 'isBase64Encoded', value: 'not a boolean' },
      { field: 'isBase64Encoded', value: null },
      { field: 'isBase64Encoded', value: undefined },
      { field: 'isBase64Encoded', value: 123 },
      { field: 'body', value: 123 },
      { field: 'body', value: {} },
    ])(
      'should return false when $field is invalid ($value)',
      ({ field, value }) => {
        const invalidEvent = { ...baseValidEvent, [field]: value };
        expect(isAPIGatewayProxyEventV1(invalidEvent)).toBe(false);
      }
    );

    it.each([
      'httpMethod',
      'path',
      'resource',
      'requestContext',
      'isBase64Encoded',
    ])('should return false when required field %s is missing', (field) => {
      const incompleteEvent = { ...baseValidEvent };
      delete incompleteEvent[field as keyof typeof incompleteEvent];
      expect(isAPIGatewayProxyEventV1(incompleteEvent)).toBe(false);
    });
  });

  describe('isAPIGatewayProxyEventV2', () => {
    const baseValidEvent = {
      version: '2.0',
      routeKey: 'GET /test',
      rawPath: '/test',
      rawQueryString: '',
      headers: {},
      requestContext: {
        accountId: '123456789012',
        apiId: 'api-id',
        domainName: 'api.example.com',
        domainPrefix: 'api',
        http: {
          method: 'GET',
          path: '/test',
          protocol: 'HTTP/1.1',
          sourceIp: '192.0.2.1',
          userAgent: 'agent',
        },
        requestId: 'id',
        routeKey: 'GET /test',
        stage: '$default',
        time: '12/Mar/2020:19:03:58 +0000',
        timeEpoch: 1583348638390,
      },
      isBase64Encoded: false,
    };

    it('should return true for valid API Gateway V2 event with all fields populated', () => {
      expect(isAPIGatewayProxyEventV2(baseValidEvent)).toBe(true);
    });

    it('should return true for real API Gateway V2 event with optional fields', () => {
      const realEvent = {
        version: '2.0',
        routeKey: 'POST /users',
        rawPath: '/users',
        rawQueryString: 'name=john&age=25',
        cookies: ['session=abc123', 'theme=dark'],
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0',
        },
        queryStringParameters: {
          name: 'john',
          age: '25',
        },
        pathParameters: {
          id: '123',
        },
        stageVariables: {
          env: 'prod',
        },
        body: '{"key":"value"}',
        isBase64Encoded: false,
        requestContext: {
          accountId: '123456789012',
          apiId: 'api-id',
          domainName: 'api.example.com',
          domainPrefix: 'api',
          http: {
            method: 'POST',
            path: '/users',
            protocol: 'HTTP/1.1',
            sourceIp: '192.0.2.1',
            userAgent: 'Mozilla/5.0',
          },
          requestId: 'request-id',
          routeKey: 'POST /users',
          stage: '$default',
          time: '12/Mar/2020:19:03:58 +0000',
          timeEpoch: 1583348638390,
        },
      };

      expect(isAPIGatewayProxyEventV2(realEvent)).toBe(true);
    });

    it.each([
      { field: 'body', value: undefined },
      { field: 'cookies', value: undefined },
      { field: 'pathParameters', value: undefined },
      { field: 'queryStringParameters', value: undefined },
      { field: 'stageVariables', value: undefined },
    ])(
      'should return true when optional field $field is $value',
      ({ field, value }) => {
        const event = { ...baseValidEvent, [field]: value };
        expect(isAPIGatewayProxyEventV2(event)).toBe(true);
      }
    );

    it.each([
      { case: 'null', event: null },
      { case: 'undefined', event: undefined },
      { case: 'string', event: 'not an object' },
      { case: 'number', event: 123 },
      { case: 'array', event: [] },
    ])('should return false for $case', ({ event }) => {
      expect(isAPIGatewayProxyEventV2(event)).toBe(false);
    });

    it.each([
      { field: 'version', value: '1.0' },
      { field: 'version', value: null },
      { field: 'version', value: undefined },
      { field: 'version', value: 123 },
      { field: 'routeKey', value: 123 },
      { field: 'routeKey', value: null },
      { field: 'routeKey', value: undefined },
      { field: 'rawPath', value: 123 },
      { field: 'rawPath', value: null },
      { field: 'rawPath', value: undefined },
      { field: 'rawQueryString', value: 123 },
      { field: 'rawQueryString', value: null },
      { field: 'rawQueryString', value: undefined },
      { field: 'headers', value: 'not an object' },
      { field: 'headers', value: null },
      { field: 'headers', value: undefined },
      { field: 'headers', value: 123 },
      { field: 'cookies', value: 'not an array' },
      { field: 'cookies', value: null },
      { field: 'cookies', value: 123 },
      { field: 'queryStringParameters', value: 'not an object' },
      { field: 'queryStringParameters', value: null },
      { field: 'queryStringParameters', value: 123 },
      { field: 'pathParameters', value: 'not an object' },
      { field: 'pathParameters', value: null },
      { field: 'pathParameters', value: 123 },
      { field: 'stageVariables', value: 'not an object' },
      { field: 'stageVariables', value: null },
      { field: 'stageVariables', value: 123 },
      { field: 'body', value: null },
      { field: 'requestContext', value: 'not an object' },
      { field: 'requestContext', value: null },
      { field: 'requestContext', value: undefined },
      { field: 'requestContext', value: 123 },
      { field: 'isBase64Encoded', value: 'not a boolean' },
      { field: 'isBase64Encoded', value: null },
      { field: 'isBase64Encoded', value: undefined },
      { field: 'isBase64Encoded', value: 123 },
      { field: 'body', value: 123 },
      { field: 'body', value: {} },
    ])(
      'should return false when $field is invalid ($value)',
      ({ field, value }) => {
        const invalidEvent = { ...baseValidEvent, [field]: value };
        expect(isAPIGatewayProxyEventV2(invalidEvent)).toBe(false);
      }
    );

    it.each([
      'version',
      'routeKey',
      'rawPath',
      'rawQueryString',
      'headers',
      'requestContext',
      'isBase64Encoded',
    ])('should return false when required field %s is missing', (field) => {
      const incompleteEvent = { ...baseValidEvent };
      delete incompleteEvent[field as keyof typeof incompleteEvent];
      expect(isAPIGatewayProxyEventV2(incompleteEvent)).toBe(false);
    });
  });

  describe('isALBEvent', () => {
    const baseValidEvent = {
      httpMethod: 'GET',
      path: '/test',
      headers: {},
      requestContext: {
        elb: {
          targetGroupArn:
            'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/my-target-group/50dc6c495c0c9188',
        },
      },
      isBase64Encoded: false,
      body: null,
    };

    it('should return true for valid ALB event', () => {
      expect(isALBEvent(baseValidEvent)).toBe(true);
    });

    it('should return true for ALB event with body', () => {
      const eventWithBody = {
        ...baseValidEvent,
        body: '{"key":"value"}',
      };

      expect(isALBEvent(eventWithBody)).toBe(true);
    });

    it.each([
      { case: 'null', event: null },
      { case: 'undefined', event: undefined },
      { case: 'string', event: 'not an object' },
      { case: 'number', event: 123 },
      { case: 'array', event: [] },
    ])('should return false for $case', ({ event }) => {
      expect(isALBEvent(event)).toBe(false);
    });

    it.each([
      { field: 'requestContext', value: null },
      { field: 'requestContext', value: undefined },
      { field: 'requestContext', value: 'not an object' },
      { field: 'requestContext', value: 123 },
    ])(
      'should return false when $field is invalid ($value)',
      ({ field, value }) => {
        const invalidEvent = { ...baseValidEvent, [field]: value };
        expect(isALBEvent(invalidEvent)).toBe(false);
      }
    );

    it('should return false when requestContext.elb is missing', () => {
      const eventWithoutElb = {
        ...baseValidEvent,
        requestContext: {},
      };

      expect(isALBEvent(eventWithoutElb)).toBe(false);
    });

    it.each([
      { value: null },
      { value: undefined },
      { value: 'not an object' },
      { value: 123 },
    ])(
      'should return false when requestContext.elb is invalid ($value)',
      ({ value }) => {
        const invalidEvent = {
          ...baseValidEvent,
          requestContext: { elb: value },
        };
        expect(isALBEvent(invalidEvent)).toBe(false);
      }
    );
  });

  describe('isAPIGatewayProxyResult', () => {
    it('should return true for valid API Gateway Proxy result', () => {
      const validResult: APIGatewayProxyResult = {
        statusCode: 200,
        body: 'Hello World',
      };

      expect(isExtendedAPIGatewayProxyResult(validResult)).toBe(true);
    });

    it('should return true for valid result with all optional fields', () => {
      const validResult = {
        statusCode: 200,
        body: 'Hello World',
        headers: { 'Content-Type': 'text/plain' },
        multiValueHeaders: { 'Set-Cookie': ['cookie1', 'cookie2'] },
        isBase64Encoded: false,
      };

      expect(isExtendedAPIGatewayProxyResult(validResult)).toBe(true);
    });

    it.each([
      { case: 'null', result: null },
      { case: 'undefined', result: undefined },
      { case: 'string', result: 'not an object' },
      { case: 'number', result: 123 },
      { case: 'array', result: [] },
    ])('should return false for $case', ({ result }) => {
      expect(isExtendedAPIGatewayProxyResult(result)).toBe(false);
    });

    it.each([
      { field: 'statusCode', value: 'not a number' },
      { field: 'statusCode', value: null },
      { field: 'body', value: 123 },
      { field: 'body', value: null },
      { field: 'headers', value: 'not an object' },
      { field: 'multiValueHeaders', value: 'not an object' },
      { field: 'isBase64Encoded', value: 'not a boolean' },
    ])(
      'should return false when $field is invalid ($value)',
      ({ field, value }) => {
        const baseResult = {
          statusCode: 200,
          body: 'Hello World',
        };

        const invalidResult = { ...baseResult, [field]: value };
        expect(isExtendedAPIGatewayProxyResult(invalidResult)).toBe(false);
      }
    );

    it('should return false when required fields are missing', () => {
      const incompleteResult = {
        statusCode: 200,
        // missing body
      };

      expect(isExtendedAPIGatewayProxyResult(incompleteResult)).toBe(false);
    });
  });

  describe('composeMiddleware', () => {
    const mockOptions: RequestContext = {
      params: {},
      event: {} as APIGatewayProxyEvent,
      context: {} as Context,
      responseType: 'ApiGatewayV1',
      req: new Request('https://example.com'),
      res: new Response(),
    };

    it('executes middleware in order', async () => {
      const executionOrder: string[] = [];
      const middleware: Middleware[] = [
        async ({ next }) => {
          executionOrder.push('middleware1-start');
          await next();
          executionOrder.push('middleware1-end');
        },
        async ({ next }) => {
          executionOrder.push('middleware2-start');
          await next();
          executionOrder.push('middleware2-end');
        },
      ];

      const composed = composeMiddleware(middleware);
      await composed({
        reqCtx: mockOptions,
        next: () => {
          executionOrder.push('handler');
          return Promise.resolve();
        },
      });

      expect(executionOrder).toEqual([
        'middleware1-start',
        'middleware2-start',
        'handler',
        'middleware2-end',
        'middleware1-end',
      ]);
    });

    it('returns result from middleware that short-circuits', async () => {
      const middleware: Middleware[] = [
        async ({ next }) => {
          await next();
        },
        () => {
          return Promise.resolve({ shortCircuit: true });
        },
      ];

      const composed = composeMiddleware(middleware);
      const result = await composed({
        reqCtx: mockOptions,
        next: () => {
          return Promise.resolve({ handler: true });
        },
      });

      expect(result).toEqual({ shortCircuit: true });
    });

    it('returns result from next function when middleware does not return', async () => {
      const middleware: Middleware[] = [
        async ({ next }) => {
          await next();
        },
      ];

      const composed = composeMiddleware(middleware);
      const result = await composed({
        reqCtx: mockOptions,
        next: () => {
          return Promise.resolve({ handler: true });
        },
      });

      expect(result).toEqual({ handler: true });
    });

    it('throws error when next() is called multiple times', async () => {
      const middleware: Middleware[] = [
        async ({ next }) => {
          await next();
          await next();
        },
      ];

      const composed = composeMiddleware(middleware);

      await expect(
        composed({ reqCtx: mockOptions, next: async () => {} })
      ).rejects.toThrow('next() called multiple times');
    });

    it('handles empty middleware array', async () => {
      const composed = composeMiddleware([]);
      const result = await composed({
        reqCtx: mockOptions,
        next: () => {
          return Promise.resolve({ handler: true });
        },
      });

      expect(result).toEqual({ handler: true });
    });

    it('returns undefined when next function returns undefined', async () => {
      const middleware: Middleware[] = [
        async ({ next }) => {
          await next();
        },
      ];

      const composed = composeMiddleware(middleware);
      const result = await composed({
        reqCtx: mockOptions,
        next: () => {
          return Promise.resolve(undefined);
        },
      });

      expect(result).toBeUndefined();
    });
  });

  describe('resolvePrefixedPath', () => {
    it.each([
      { path: '/test', prefix: '/prefix', expected: '/prefix/test' },
      { path: '/', prefix: '/prefix', expected: '/prefix' },
      { path: '/test', expected: '/test' },
      { path: /.+/, prefix: '/prefix', expected: /\/prefix\/.+/ },
      { path: '/test', prefix: /\/prefix/, expected: /\/prefix\/test/ },
      { path: /.+/, prefix: /\/prefix/, expected: /\/prefix\/.+/ },
    ])('resolves prefixed path', ({ path, prefix, expected }) => {
      // Prepare & Act
      const resolvedPath = resolvePrefixedPath(path as Path, prefix as Path);

      // Assert
      expect(resolvedPath).toEqual(expected);
    });
  });

  describe('HttpResponseStream', () => {
    it('uses globalThis.awslambda.HttpResponseStream when available', async () => {
      // Prepare
      const mockHttpResponseStream = { from: vi.fn() };
      vi.stubGlobal('awslambda', {
        HttpResponseStream: mockHttpResponseStream,
      });

      // Clear module cache and dynamically import
      vi.resetModules();
      const { HttpResponseStream } = await import('../../../src/http/utils.js');

      // Assert
      expect(HttpResponseStream).toBe(mockHttpResponseStream);
    });
  });
});
