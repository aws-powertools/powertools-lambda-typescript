import type { APIGatewayProxyEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import {
  handlerResultToProxyResult,
  proxyEventToWebRequest,
  responseToProxyResult,
} from '../../../src/rest/converters.js';

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
      const request = proxyEventToWebRequest(baseEvent);

      expect(request).toBeInstanceOf(Request);
      expect(request.method).toBe('GET');
      expect(request.url).toBe('https://api.example.com/test');
      expect(request.body).toBe(null);
    });

    it('uses Host header over domainName', () => {
      const event = {
        ...baseEvent,
        headers: { Host: 'custom.example.com' },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      expect(request.url).toBe('https://custom.example.com/test');
    });

    it('uses X-Forwarded-Proto header for protocol', () => {
      const event = {
        ...baseEvent,
        headers: { 'X-Forwarded-Proto': 'https' },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      expect(request.url).toBe('https://api.example.com/test');
    });

    it('handles null values in multiValueHeaders arrays', () => {
      const event = {
        ...baseEvent,
        multiValueHeaders: {
          Accept: null as any,
          'Custom-Header': ['value1'],
        },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Accept')).toBe(null);
      expect(request.headers.get('Custom-Header')).toBe('value1');
    });

    it('handles null values in multiValueQueryStringParameters arrays', () => {
      const event = {
        ...baseEvent,
        multiValueQueryStringParameters: {
          filter: null as any,
          sort: ['desc'],
        },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      const url = new URL(request.url);
      expect(url.searchParams.has('filter')).toBe(false);
      expect(url.searchParams.get('sort')).toBe('desc');
    });

    it('handles POST request with string body', async () => {
      const event = {
        ...baseEvent,
        httpMethod: 'POST',
        body: '{"key":"value"}',
        headers: { 'Content-Type': 'application/json' },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      expect(request.method).toBe('POST');
      expect(await request.text()).toBe('{"key":"value"}');
      expect(request.headers.get('Content-Type')).toBe('application/json');
    });

    it('decodes base64 encoded body', async () => {
      const originalText = 'Hello World';
      const base64Text = Buffer.from(originalText).toString('base64');

      const event = {
        ...baseEvent,
        httpMethod: 'POST',
        body: base64Text,
        isBase64Encoded: true,
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      expect(await request.text()).toBe(originalText);
    });

    it('handles single-value headers', () => {
      const event = {
        ...baseEvent,
        headers: {
          Authorization: 'Bearer token123',
          'User-Agent': 'test-agent',
        },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Authorization')).toBe('Bearer token123');
      expect(request.headers.get('User-Agent')).toBe('test-agent');
    });

    it('handles multiValueHeaders', () => {
      const event = {
        ...baseEvent,
        multiValueHeaders: {
          Accept: ['application/json', 'text/html'],
          'Custom-Header': ['value1', 'value2'],
        },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Accept')).toBe('application/json, text/html');
      expect(request.headers.get('Custom-Header')).toBe('value1, value2');
    });

    it('handles both single and multi-value headers', () => {
      const event = {
        ...baseEvent,
        headers: {
          Authorization: 'Bearer token123',
        },
        multiValueHeaders: {
          Accept: ['application/json', 'text/html'],
        },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Authorization')).toBe('Bearer token123');
      expect(request.headers.get('Accept')).toBe('application/json, text/html');
    });

    it('deduplicates headers when same header exists in both headers and multiValueHeaders', () => {
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

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Host')).toBe(
        'abcd1234.execute-api.eu-west-1.amazonaws.com'
      );
      expect(request.headers.get('X-Forwarded-Proto')).toBe('https');
    });

    it('appends unique values from multiValueHeaders when header already exists', () => {
      const event = {
        ...baseEvent,
        headers: {
          Accept: 'application/json',
        },
        multiValueHeaders: {
          Accept: ['application/json', 'text/html'],
        },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Accept')).toBe('application/json, text/html');
    });

    it('handles queryStringParameters', () => {
      const event = {
        ...baseEvent,
        queryStringParameters: {
          name: 'john',
          age: '25',
        },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      const url = new URL(request.url);
      expect(url.searchParams.get('name')).toBe('john');
      expect(url.searchParams.get('age')).toBe('25');
    });

    it('handles multiValueQueryStringParameters', () => {
      const event = {
        ...baseEvent,
        multiValueQueryStringParameters: {
          filter: ['name', 'age'],
          sort: ['desc'],
        },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      const url = new URL(request.url);
      expect(url.searchParams.getAll('filter')).toEqual(['name', 'age']);
      expect(url.searchParams.get('sort')).toBe('desc');
    });

    it('handles both queryStringParameters and multiValueQueryStringParameters', () => {
      const event = {
        ...baseEvent,
        queryStringParameters: {
          single: 'value',
        },
        multiValueQueryStringParameters: {
          multi: ['value1', 'value2'],
        },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      const url = new URL(request.url);
      expect(url.searchParams.get('single')).toBe('value');
      expect(url.searchParams.getAll('multi')).toEqual(['value1', 'value2']);
    });

    it('skips null queryStringParameter values', () => {
      const event = {
        ...baseEvent,
        queryStringParameters: {
          valid: 'value',
          null: null as any,
        },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      const url = new URL(request.url);
      expect(url.searchParams.get('valid')).toBe('value');
      expect(url.searchParams.has('null')).toBe(false);
    });

    it('skips null header values', () => {
      const event = {
        ...baseEvent,
        headers: {
          'Valid-Header': 'value',
          'Null-Header': null as any,
        },
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Valid-Header')).toBe('value');
      expect(request.headers.get('Null-Header')).toBe(null);
    });

    it('handles null/undefined collections', () => {
      const event = {
        ...baseEvent,
        headers: null as any,
        multiValueHeaders: null as any,
        queryStringParameters: null as any,
        multiValueQueryStringParameters: null as any,
      };

      const request = proxyEventToWebRequest(event);
      expect(request).toBeInstanceOf(Request);
      expect(request.method).toBe('GET');
      expect(request.url).toBe('https://api.example.com/test');
    });
  });

  describe('responseToProxyResult', () => {
    it('converts basic Response to API Gateway result', async () => {
      const response = new Response('Hello World', {
        status: 200,
        headers: {
          'Content-type': 'application/json',
        },
      });

      const result = await responseToProxyResult(response);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('Hello World');
      expect(result.isBase64Encoded).toBe(false);
      expect(result.headers).toEqual({ 'content-type': 'application/json' });
      expect(result.multiValueHeaders).toEqual({});
    });

    it('handles single-value headers', async () => {
      const response = new Response('Hello', {
        status: 201,
        headers: { 'content-type': 'text/plain', 'x-custom': 'value' },
      });

      const result = await responseToProxyResult(response);

      expect(result.statusCode).toBe(201);
      expect(result.headers).toEqual({
        'content-type': 'text/plain',
        'x-custom': 'value',
      });
      expect(result.multiValueHeaders).toEqual({});
    });

    it('handles multi-value headers', async () => {
      const response = new Response('Hello', {
        status: 200,
        headers: {
          'Set-Cookie': 'cookie1=value1, cookie2=value2',
          'Content-type': 'application/json',
        },
      });

      const result = await responseToProxyResult(response);

      expect(result.headers).toEqual({ 'content-type': 'application/json' });
      expect(result.multiValueHeaders).toEqual({
        'set-cookie': ['cookie1=value1', 'cookie2=value2'],
      });
    });

    it('handles mixed single and multi-value headers', async () => {
      const response = new Response('Hello', {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'Set-Cookie': 'session=abc, theme=dark',
        },
      });

      const result = await responseToProxyResult(response);

      expect(result.headers).toEqual({
        'content-type': 'application/json',
      });
      expect(result.multiValueHeaders).toEqual({
        'set-cookie': ['session=abc', 'theme=dark'],
      });
    });

    it('handles different status codes', async () => {
      const response = new Response('Not Found', { status: 404 });

      const result = await responseToProxyResult(response);

      expect(result.statusCode).toBe(404);
      expect(result.body).toBe('Not Found');
    });

    it('handles empty response body', async () => {
      const response = new Response(null, { status: 204 });

      const result = await responseToProxyResult(response);

      expect(result.statusCode).toBe(204);
      expect(result.body).toBe('');
    });
  });

  describe('handlerResultToProxyResult', () => {
    it('returns APIGatewayProxyResult as-is', async () => {
      const proxyResult = {
        statusCode: 200,
        body: 'test',
        headers: { 'content-type': 'text/plain' },
        isBase64Encoded: false,
      };

      const result = await handlerResultToProxyResult(proxyResult);

      expect(result).toBe(proxyResult);
    });

    it('converts Response object', async () => {
      const response = new Response('Hello', { status: 201 });

      const result = await handlerResultToProxyResult(response);

      expect(result.statusCode).toBe(201);
      expect(result.body).toBe('Hello');
      expect(result.isBase64Encoded).toBe(false);
    });

    it('converts plain object to JSON', async () => {
      const obj = { message: 'success', data: [1, 2, 3] };

      const result = await handlerResultToProxyResult(obj);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(JSON.stringify(obj));
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(result.isBase64Encoded).toBe(false);
    });
  });
});
