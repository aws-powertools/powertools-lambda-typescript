import type { APIGatewayProxyEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import {
  compilePath,
  isAPIGatewayProxyEvent,
  validatePathPattern,
} from '../../../src/rest/utils.js';
import type { Path } from '../../../src/types/rest.js';

describe('Path Utilities', () => {
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

  describe('isAPIGatewayProxyEvent', () => {
    it('should return true for valid API Gateway Proxy event', () => {
      const validEvent: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/test',
        resource: '/test',
        headers: {},
        requestContext: {
          accountId: '123456789012',
          apiId: 'test-api',
          httpMethod: 'GET',
          requestId: 'test-request-id',
          resourceId: 'test-resource',
          resourcePath: '/test',
          stage: 'test',
          identity: {
            sourceIp: '127.0.0.1',
          },
        } as any,
        isBase64Encoded: false,
        body: null,
      } as APIGatewayProxyEvent;

      expect(isAPIGatewayProxyEvent(validEvent)).toBe(true);
    });

    it('should return true for valid event with string body', () => {
      const validEvent = {
        httpMethod: 'POST',
        path: '/test',
        resource: '/test',
        headers: { 'content-type': 'application/json' },
        requestContext: { stage: 'test' },
        isBase64Encoded: false,
        body: '{"key":"value"}',
      };

      expect(isAPIGatewayProxyEvent(validEvent)).toBe(true);
    });

    it.each([
      { case: 'null', event: null },
      { case: 'undefined', event: undefined },
      { case: 'string', event: 'not an object' },
      { case: 'number', event: 123 },
      { case: 'array', event: [] },
    ])('should return false for $case', ({ event }) => {
      expect(isAPIGatewayProxyEvent(event)).toBe(false);
    });

    it.each([
      { field: 'httpMethod', value: 123 },
      { field: 'httpMethod', value: null },
      { field: 'path', value: 123 },
      { field: 'path', value: null },
      { field: 'resource', value: 123 },
      { field: 'resource', value: null },
      { field: 'headers', value: 'not an object' },
      { field: 'headers', value: null },
      { field: 'requestContext', value: 'not an object' },
      { field: 'requestContext', value: null },
      { field: 'isBase64Encoded', value: 'not a boolean' },
      { field: 'isBase64Encoded', value: null },
      { field: 'body', value: 123 },
    ])(
      'should return false when $field is invalid ($value)',
      ({ field, value }) => {
        const baseEvent = {
          httpMethod: 'GET',
          path: '/test',
          resource: '/test',
          headers: {},
          requestContext: {},
          isBase64Encoded: false,
          body: null,
        };

        const invalidEvent = { ...baseEvent, [field]: value };
        expect(isAPIGatewayProxyEvent(invalidEvent)).toBe(false);
      }
    );

    it('should return false when required fields are missing', () => {
      const incompleteEvent = {
        httpMethod: 'GET',
        path: '/test',
        // missing resource, headers, requestContext, isBase64Encoded, body
      };

      expect(isAPIGatewayProxyEvent(incompleteEvent)).toBe(false);
    });
  });
});
