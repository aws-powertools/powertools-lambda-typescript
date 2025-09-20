import type { APIGatewayProxyEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import {
  handlerResultToProxyResult,
  handlerResultToWebResponse,
  proxyEventToWebRequest,
  webResponseToProxyResult,
} from '../../../src/rest/index.js';

describe('Converters', () => {
  describe('proxyEventToWebRequest', () => {
    const baseEvent: APIGatewayProxyEvent = {
      httpMethod: 'GET',
      path: '/test',
      resource: '/test',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: {},
      pathParameters: null,
      stageVariables: null,
      requestContext: {
        accountId: '123456789012',
        apiId: 'test-api',
        httpMethod: 'GET',
        path: '/test',
        requestId: 'test-request-id',
        resourceId: 'test-resource',
        resourcePath: '/test',
        stage: 'test',
        domainName: 'api.example.com',
        identity: {
          sourceIp: '127.0.0.1',
        },
      } as any,
      isBase64Encoded: false,
      body: null,
    };

    it('converts basic GET request', () => {
      // Prepare & Act
      const request = proxyEventToWebRequest(baseEvent);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.method).toBe('GET');
      expect(request.url).toBe('https://api.example.com/test');
      expect(request.body).toBe(null);
    });

    it('uses Host header over domainName', () => {
      // Prepare
      const event = {
        ...baseEvent,
        headers: { Host: 'custom.example.com' },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.url).toBe('https://custom.example.com/test');
    });

    it('uses X-Forwarded-Proto header for protocol', () => {
      // Prepare
      const event = {
        ...baseEvent,
        headers: { 'X-Forwarded-Proto': 'https' },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.url).toBe('https://api.example.com/test');
    });

    it('handles null values in multiValueHeaders arrays', () => {
      // Prepare
      const event = {
        ...baseEvent,
        multiValueHeaders: {
          Accept: null as any,
          'Custom-Header': ['value1'],
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Accept')).toBe(null);
      expect(request.headers.get('Custom-Header')).toBe('value1');
    });

    it('handles null values in multiValueQueryStringParameters arrays', () => {
      // Prepare
      const event = {
        ...baseEvent,
        multiValueQueryStringParameters: {
          filter: null as any,
          sort: ['desc'],
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      const url = new URL(request.url);
      expect(url.searchParams.has('filter')).toBe(false);
      expect(url.searchParams.get('sort')).toBe('desc');
    });

    it('handles POST request with string body', async () => {
      // Prepare
      const event = {
        ...baseEvent,
        httpMethod: 'POST',
        body: '{"key":"value"}',
        headers: { 'Content-Type': 'application/json' },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.method).toBe('POST');
      expect(request.text()).resolves.toBe('{"key":"value"}');
      expect(request.headers.get('Content-Type')).toBe('application/json');
    });

    it('decodes base64 encoded body', async () => {
      // Prepare
      const originalText = 'Hello World';
      const base64Text = Buffer.from(originalText).toString('base64');
      const event = {
        ...baseEvent,
        httpMethod: 'POST',
        body: base64Text,
        isBase64Encoded: true,
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.text()).resolves.toBe(originalText);
    });

    it('handles single-value headers', () => {
      // Prepare
      const event = {
        ...baseEvent,
        headers: {
          Authorization: 'Bearer token123',
          'User-Agent': 'test-agent',
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Authorization')).toBe('Bearer token123');
      expect(request.headers.get('User-Agent')).toBe('test-agent');
    });

    it('handles multiValueHeaders', () => {
      // Prepare
      const event = {
        ...baseEvent,
        multiValueHeaders: {
          Accept: ['application/json', 'text/html'],
          'Custom-Header': ['value1', 'value2'],
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Accept')).toBe('application/json, text/html');
      expect(request.headers.get('Custom-Header')).toBe('value1, value2');
    });

    it('handles both single and multi-value headers', () => {
      // Prepare
      const event = {
        ...baseEvent,
        headers: {
          Authorization: 'Bearer token123',
        },
        multiValueHeaders: {
          Accept: ['application/json', 'text/html'],
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Authorization')).toBe('Bearer token123');
      expect(request.headers.get('Accept')).toBe('application/json, text/html');
    });

    it('deduplicates headers when same header exists in both headers and multiValueHeaders', () => {
      // Prepare
      const event = {
        ...baseEvent,
        headers: {
          Host: 'abcd1234.execute-api.eu-west-1.amazonaws.com',
          'X-Forwarded-Proto': 'https',
        },
        multiValueHeaders: {
          Host: ['abcd1234.execute-api.eu-west-1.amazonaws.com'],
          'X-Forwarded-Proto': ['https'],
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Host')).toBe(
        'abcd1234.execute-api.eu-west-1.amazonaws.com'
      );
      expect(request.headers.get('X-Forwarded-Proto')).toBe('https');
    });

    it('appends unique values from multiValueHeaders when header already exists', () => {
      // Prepare
      const event = {
        ...baseEvent,
        headers: {
          Accept: 'application/json',
        },
        multiValueHeaders: {
          Accept: ['application/json', 'text/html'],
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Accept')).toBe('application/json, text/html');
    });

    it('handles queryStringParameters', () => {
      // Prepare
      const event = {
        ...baseEvent,
        queryStringParameters: {
          name: 'john',
          age: '25',
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      const url = new URL(request.url);
      expect(url.searchParams.get('name')).toBe('john');
      expect(url.searchParams.get('age')).toBe('25');
    });

    it('handles multiValueQueryStringParameters', () => {
      // Prepare
      const event = {
        ...baseEvent,
        multiValueQueryStringParameters: {
          filter: ['name', 'age'],
          sort: ['desc'],
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      const url = new URL(request.url);
      expect(url.searchParams.getAll('filter')).toEqual(['name', 'age']);
      expect(url.searchParams.get('sort')).toBe('desc');
    });

    it('handles both queryStringParameters and multiValueQueryStringParameters', () => {
      // Prepare
      const event = {
        ...baseEvent,
        queryStringParameters: {
          single: 'value',
        },
        multiValueQueryStringParameters: {
          multi: ['value1', 'value2'],
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      const url = new URL(request.url);
      expect(url.searchParams.get('single')).toBe('value');
      expect(url.searchParams.getAll('multi')).toEqual(['value1', 'value2']);
    });

    it('skips null queryStringParameter values', () => {
      // Prepare
      const event = {
        ...baseEvent,
        queryStringParameters: {
          valid: 'value',
          null: null as any,
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      const url = new URL(request.url);
      expect(url.searchParams.get('valid')).toBe('value');
      expect(url.searchParams.has('null')).toBe(false);
    });

    it('skips null header values', () => {
      // Prepare
      const event = {
        ...baseEvent,
        headers: {
          'Valid-Header': 'value',
          'Null-Header': null as any,
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Valid-Header')).toBe('value');
      expect(request.headers.get('Null-Header')).toBe(null);
    });

    it('handles null/undefined collections', () => {
      // Prepare
      const event = {
        ...baseEvent,
        headers: null as any,
        multiValueHeaders: null as any,
        queryStringParameters: null as any,
        multiValueQueryStringParameters: null as any,
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.method).toBe('GET');
      expect(request.url).toBe('https://api.example.com/test');
    });
  });

  describe('responseToProxyResult', () => {
    it('converts basic Response to API Gateway result', async () => {
      // Prepare
      const response = new Response('Hello World', {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      });

      // Act
      const result = await webResponseToProxyResult(response);

      // Assess
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('Hello World');
      expect(result.isBase64Encoded).toBe(false);
      expect(result.headers).toEqual({ 'content-type': 'application/json' });
    });

    it('handles single-value headers', async () => {
      // Prepare
      const response = new Response('Hello', {
        status: 201,
        headers: { 'content-type': 'text/plain', 'x-custom': 'value' },
      });

      // Act
      const result = await webResponseToProxyResult(response);

      // Assess
      expect(result.statusCode).toBe(201);
      expect(result.headers).toEqual({
        'content-type': 'text/plain',
        'x-custom': 'value',
      });
    });

    it('handles multi-value headers', async () => {
      // Prepare
      const response = new Response('Hello', {
        status: 200,
        headers: {
          'Set-Cookie': 'cookie1=value1, cookie2=value2',
          'Content-type': 'application/json',
        },
      });

      // Act
      const result = await webResponseToProxyResult(response);

      // Assess
      expect(result.headers).toEqual({ 'content-type': 'application/json' });
      expect(result.multiValueHeaders).toEqual({
        'set-cookie': ['cookie1=value1', 'cookie2=value2'],
      });
    });

    it('handles mixed single and multi-value headers', async () => {
      // Prepare
      const response = new Response('Hello', {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'Set-Cookie': 'session=abc, theme=dark',
        },
      });

      // Act
      const result = await webResponseToProxyResult(response);

      // Assess
      expect(result.headers).toEqual({
        'content-type': 'application/json',
      });
      expect(result.multiValueHeaders).toEqual({
        'set-cookie': ['session=abc', 'theme=dark'],
      });
    });

    it('handles different status codes', async () => {
      // Prepare
      const response = new Response('Not Found', { status: 404 });

      // Act
      const result = await webResponseToProxyResult(response);

      // Assess
      expect(result.statusCode).toBe(404);
      expect(result.body).toBe('Not Found');
    });

    it('handles empty response body', async () => {
      const response = new Response(null, { status: 204 });

      // Act
      const result = await webResponseToProxyResult(response);

      // Assess
      expect(result.statusCode).toBe(204);
      expect(result.body).toBe('');
    });

    it('handles compressed response body', async () => {
      // Prepare
      const response = new Response('Hello World', {
        status: 200,
        headers: {
          'content-encoding': 'gzip',
        },
      });

      // Act
      const result = await webResponseToProxyResult(response);

      // Assess
      expect(result.isBase64Encoded).toBe(true);
      expect(result.body).toEqual(
        Buffer.from('Hello World').toString('base64')
      );
    });
  });

  describe('handlerResultToProxyResult', () => {
    it('returns APIGatewayProxyResult as-is', async () => {
      // Prepare
      const proxyResult = {
        statusCode: 200,
        body: 'test',
        headers: { 'content-type': 'text/plain' },
        isBase64Encoded: false,
      };

      // Act
      const result = await handlerResultToProxyResult(proxyResult);

      // Assess
      expect(result).toBe(proxyResult);
    });

    it('converts Response object', async () => {
      // Prepare
      const response = new Response('Hello', { status: 201 });

      // Act
      const result = await handlerResultToProxyResult(response);

      // Assess
      expect(result.statusCode).toBe(201);
      expect(result.body).toBe('Hello');
      expect(result.isBase64Encoded).toBe(false);
    });

    it('converts plain object to JSON', async () => {
      // Prepare
      const obj = { message: 'success', data: [1, 2, 3] };

      // Act
      const result = await handlerResultToProxyResult(obj);

      // Assess
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(JSON.stringify(obj));
      expect(result.headers).toEqual({ 'content-type': 'application/json' });
      expect(result.isBase64Encoded).toBe(false);
    });
  });

  describe('handlerResultToResponse', () => {
    it('converts APIGatewayProxyResult to Response', async () => {
      // Prepare
      const proxyResult = {
        statusCode: 201,
        body: 'Hello World',
        headers: { 'content-type': 'text/plain' },
        isBase64Encoded: false,
      };

      // Act
      const result = handlerResultToWebResponse(proxyResult);

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(201);
      expect(await result.text()).toBe('Hello World');
      expect(result.headers.get('content-type')).toBe('text/plain');
    });

    it('converts APIGatewayProxyResult with multiValueHeaders', async () => {
      // Prepare
      const proxyResult = {
        statusCode: 200,
        body: 'test',
        headers: { 'content-type': 'application/json' },
        multiValueHeaders: {
          'Set-Cookie': ['cookie1=value1', 'cookie2=value2'],
        },
        isBase64Encoded: false,
      };

      // Act
      const result = handlerResultToWebResponse(proxyResult);

      // Assess
      expect(result.headers.get('content-type')).toBe('application/json');
      expect(result.headers.get('Set-Cookie')).toBe(
        'cookie1=value1, cookie2=value2'
      );
    });

    it('converts plain object to JSON Response with default headers', async () => {
      // Prepare
      const obj = { message: 'success' };

      // Act
      const result = handlerResultToWebResponse(obj);

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(200);
      expect(result.text()).resolves.toBe(JSON.stringify(obj));
      expect(result.headers.get('Content-Type')).toBe('application/json');
    });

    it('uses provided headers for plain object', async () => {
      // Prepare
      const obj = { message: 'success' };
      const headers = new Headers({ 'x-custom': 'value' });

      // Act
      const result = handlerResultToWebResponse(obj, headers);

      // Assess
      expect(result.headers.get('Content-Type')).toBe('application/json');
      expect(result.headers.get('x-custom')).toBe('value');
    });

    it('handles APIGatewayProxyResult with undefined headers', async () => {
      // Prepare
      const proxyResult = {
        statusCode: 200,
        body: 'test',
        headers: undefined,
        isBase64Encoded: false,
      };

      // Act
      const result = handlerResultToWebResponse(proxyResult);

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(200);
    });

    it('handles APIGatewayProxyResult with undefined multiValueHeaders', async () => {
      // Prepare
      const proxyResult = {
        statusCode: 200,
        body: 'test',
        headers: { 'content-type': 'text/plain' },
        multiValueHeaders: undefined,
        isBase64Encoded: false,
      };

      // Act
      const result = handlerResultToWebResponse(proxyResult);

      // Assess
      expect(result.headers.get('content-type')).toBe('text/plain');
    });

    it('handles APIGatewayProxyResult with undefined values in multiValueHeaders', async () => {
      // Prepare
      const proxyResult = {
        statusCode: 200,
        body: 'test',
        headers: { 'content-type': 'text/plain' },
        multiValueHeaders: { 'Set-Cookie': undefined },
        isBase64Encoded: false,
      };

      // Act
      const result = handlerResultToWebResponse(proxyResult);

      // Assess
      expect(result.headers.get('content-type')).toBe('text/plain');
    });

    it('merges headers from resHeaders with Response object, headers from Response take precedence', () => {
      // Prepare
      const response = new Response('Hello', {
        headers: { 'content-type': 'text/plain' },
      });
      const resHeaders = new Headers({
        'x-custom': 'value',
        'content-type': 'application/json', // should not override existing
      });

      // Act
      const result = handlerResultToWebResponse(response, resHeaders);

      // Assess
      expect(result.headers.get('content-type')).toBe('text/plain');
      expect(result.headers.get('x-custom')).toBe('value');
      expect(result.status).toBe(200);
      expect(result.text()).resolves.toBe('Hello');
    });
  });
});
