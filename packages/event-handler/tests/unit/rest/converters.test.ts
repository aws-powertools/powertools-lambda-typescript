import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import {
  bodyToNodeStream,
  webHeadersToApiGatewayHeaders,
} from '../../../src/rest/converters.js';
import {
  HttpStatusCodes,
  handlerResultToWebResponse,
  proxyEventToWebRequest,
  webResponseToProxyResult,
} from '../../../src/rest/index.js';
import { createTestEvent, createTestEventV2 } from './helpers.js';

describe('Converters', () => {
  describe('proxyEventToWebRequest (V1)', () => {
    const baseEvent = createTestEvent('/test', 'GET');
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
      const event = createTestEvent('/test', 'GET', {
        'X-Forwarded-Proto': 'http',
      });

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.url).toBe('http://api.example.com/test');
    });

    it('handles undefined values in multiValueHeaders arrays', () => {
      // Prepare
      const event = {
        ...baseEvent,
        multiValueHeaders: {
          Accept: undefined,
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

    it('handles undefined values in multiValueQueryStringParameters arrays', () => {
      // Prepare
      const event = {
        ...baseEvent,
        multiValueQueryStringParameters: {
          filter: undefined,
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

    it('handles POST request with string body', () => {
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

    it('decodes base64 encoded body', () => {
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

    it('skips undefined queryStringParameter values', () => {
      // Prepare
      const event = {
        ...baseEvent,
        queryStringParameters: {
          valid: 'value',
          null: undefined,
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

    it('skips undefined header values', () => {
      // Prepare
      const event = {
        ...baseEvent,
        headers: {
          valid: 'value',
          undefined: undefined,
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('valid')).toBe('value');
      expect(request.headers.has('undefined')).toBe(false);
    });

    it('handles null headers and multiValueHeaders', () => {
      // Prepare
      const event = {
        ...baseEvent,
        headers: null,
        multiValueHeaders: null,
      };

      // Act
      // The type in the aws-lambda package is incorrect, headers and multiValueHeaders
      // can be null if you use the test functionality in the AWS console
      // @ts-expect-error - testing null headers fallback
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.url).toBe('https://api.example.com/test');
    });
  });

  describe('proxyEventToWebRequest (V2)', () => {
    it('converts basic GET request', () => {
      // Prepare
      const event = createTestEventV2('/test', 'GET');

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.method).toBe('GET');
      expect(request.url).toBe('https://api.example.com/test');
      expect(request.body).toBe(null);
    });

    it('handles query string', () => {
      // Prepare
      const event = {
        ...createTestEventV2('/test', 'GET'),
        rawQueryString: 'name=john&age=25',
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.url).toBe('https://api.example.com/test?name=john&age=25');
    });

    it('handles empty query string', () => {
      // Prepare
      const event = createTestEventV2('/test', 'GET');

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.url).toBe('https://api.example.com/test');
    });

    it('uses Host header over domainName', () => {
      // Prepare
      const event = {
        ...createTestEventV2('/test', 'GET'),
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
      const event = createTestEventV2('/test', 'GET', {
        'X-Forwarded-Proto': 'http',
      });

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.url).toBe('http://api.example.com/test');
    });

    it('handles POST request with string body', () => {
      // Prepare
      const event = {
        ...createTestEventV2('/test', 'POST'),
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

    it('decodes base64 encoded body', () => {
      // Prepare
      const originalText = 'Hello World';
      const base64Text = Buffer.from(originalText).toString('base64');
      const event = {
        ...createTestEventV2('/test', 'POST'),
        body: base64Text,
        isBase64Encoded: true,
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.text()).resolves.toBe(originalText);
    });

    it('handles cookies array', () => {
      // Prepare
      const event = {
        ...createTestEventV2('/test', 'GET'),
        cookies: ['session=abc123', 'user=john'],
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Cookie')).toBe('session=abc123; user=john');
    });

    it('handles undefined cookies', () => {
      // Prepare
      const event = createTestEventV2('/test', 'GET');

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.has('Cookie')).toBe(false);
    });

    it('handles headers', () => {
      // Prepare
      const event = createTestEventV2('/test', 'GET', {
        Authorization: 'Bearer token123',
        'User-Agent': 'test-agent',
      });

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('Authorization')).toBe('Bearer token123');
      expect(request.headers.get('User-Agent')).toBe('test-agent');
    });

    it('skips undefined header values', () => {
      // Prepare
      const event = {
        ...createTestEventV2('/test', 'GET'),
        headers: {
          valid: 'value',
          undefined: undefined,
        },
      };

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.headers.get('valid')).toBe('value');
      expect(request.headers.has('undefined')).toBe(false);
    });

    it('handles undefined body', () => {
      // Prepare
      const event = createTestEventV2('/test', 'GET');

      // Act
      const request = proxyEventToWebRequest(event);

      // Assess
      expect(request).toBeInstanceOf(Request);
      expect(request.body).toBe(null);
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
      const result = await webResponseToProxyResult(response, 'ApiGatewayV1');

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
      const result = await webResponseToProxyResult(response, 'ApiGatewayV1');

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
          'Set-Cookie': 'cookie1=value1; cookie2=value2',
          'Content-type': 'application/json',
        },
      });

      // Act
      const result = await webResponseToProxyResult(response, 'ApiGatewayV1');

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
      const result = await webResponseToProxyResult(response, 'ApiGatewayV1');

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
      const result = await webResponseToProxyResult(response, 'ApiGatewayV1');

      // Assess
      expect(result.statusCode).toBe(404);
      expect(result.body).toBe('Not Found');
    });

    it('handles empty response body', async () => {
      const response = new Response(null, { status: 204 });

      // Act
      const result = await webResponseToProxyResult(response, 'ApiGatewayV1');

      // Assess
      expect(result.statusCode).toBe(204);
      expect(result.body).toBe('');
    });

    it('respects isBase64Encoded option', async () => {
      // Prepare
      const response = new Response('Hello World', {
        status: 200,
        headers: {
          'content-encoding': 'gzip',
        },
      });

      // Act
      const result = await webResponseToProxyResult(response, 'ApiGatewayV1', {
        isBase64Encoded: true,
      });

      // Assess
      expect(result.isBase64Encoded).toBe(true);
      expect(result.body).toEqual(
        Buffer.from('Hello World').toString('base64')
      );
    });
  });

  describe('webResponseToProxyResult - V2', () => {
    it('converts basic Response to API Gateway V2 result', async () => {
      // Prepare
      const response = new Response('Hello World', {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      });

      // Act
      const result = await webResponseToProxyResult(response, 'ApiGatewayV2');

      // Assess
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('Hello World');
      expect(result.isBase64Encoded).toBe(false);
      expect(result.headers).toEqual({ 'content-type': 'application/json' });
      expect(result.cookies).toBeUndefined();
    });

    it('handles single-value headers', async () => {
      // Prepare
      const response = new Response('Hello', {
        status: 201,
        headers: { 'content-type': 'text/plain', 'x-custom': 'value' },
      });

      // Act
      const result = await webResponseToProxyResult(response, 'ApiGatewayV2');

      // Assess
      expect(result.statusCode).toBe(201);
      expect(result.headers).toEqual({
        'content-type': 'text/plain',
        'x-custom': 'value',
      });
    });

    it('extracts Set-Cookie headers into cookies array', async () => {
      // Prepare
      const response = new Response('Hello', {
        status: 200,
        headers: {
          'Set-Cookie': 'session=abc, theme=dark',
          'content-type': 'application/json',
        },
      });

      // Act
      const result = await webResponseToProxyResult(response, 'ApiGatewayV2');

      // Assess
      expect(result.headers).toEqual({ 'content-type': 'application/json' });
      expect(result.cookies).toEqual(['session=abc', 'theme=dark']);
    });

    it('handles multiple Set-Cookie headers', async () => {
      // Prepare
      const response = new Response('Hello', {
        status: 200,
        headers: {
          'Set-Cookie': 'cookie1=value1, cookie2=value2, cookie3=value3',
        },
      });

      // Act
      const result = await webResponseToProxyResult(response, 'ApiGatewayV2');

      // Assess
      expect(result.cookies).toEqual([
        'cookie1=value1',
        'cookie2=value2',
        'cookie3=value3',
      ]);
      expect(result.headers?.['set-cookie']).toBeUndefined();
    });

    it('handles different status codes', async () => {
      // Prepare
      const response = new Response('Not Found', { status: 404 });

      // Act
      const result = await webResponseToProxyResult(response, 'ApiGatewayV2');

      // Assess
      expect(result.statusCode).toBe(404);
      expect(result.body).toBe('Not Found');
    });

    it('handles empty response body', async () => {
      // Prepare
      const response = new Response(null, { status: 204 });

      // Act
      const result = await webResponseToProxyResult(response, 'ApiGatewayV2');

      // Assess
      expect(result.statusCode).toBe(204);
      expect(result.body).toBe('');
    });

    it('respects isBase64Encoded option', async () => {
      // Prepare
      const response = new Response('Hello World', {
        status: 200,
        headers: {
          'content-encoding': 'gzip',
        },
      });

      // Act
      const result = await webResponseToProxyResult(response, 'ApiGatewayV2', {
        isBase64Encoded: true,
      });

      // Assess
      expect(result.isBase64Encoded).toBe(true);
      expect(result.body).toBe(Buffer.from('Hello World').toString('base64'));
    });
  });

  describe('handlerResultToResponse', () => {
    it('converts APIGatewayProxyResult to Response', async () => {
      // Prepare
      const proxyResult = {
        statusCode: HttpStatusCodes.CREATED,
        body: 'Hello World',
        headers: { 'content-type': 'text/plain' },
        isBase64Encoded: false,
      };

      // Act
      const result = handlerResultToWebResponse(proxyResult);

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpStatusCodes.CREATED);
      expect(await result.text()).toBe('Hello World');
      expect(result.headers.get('content-type')).toBe('text/plain');
    });

    it('converts APIGatewayProxyResult with multiValueHeaders', () => {
      // Prepare
      const proxyResult = {
        statusCode: HttpStatusCodes.OK,
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
      expect(result.status).toBe(HttpStatusCodes.OK);
      expect(result.headers.get('content-type')).toBe('application/json');
      expect(result.headers.get('Set-Cookie')).toBe(
        'cookie1=value1, cookie2=value2'
      );
    });

    it('converts plain object to JSON Response with default headers', () => {
      // Prepare
      const obj = { message: 'success' };

      // Act
      const result = handlerResultToWebResponse(obj);

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpStatusCodes.OK);
      expect(result.text()).resolves.toBe(JSON.stringify(obj));
      expect(result.headers.get('Content-Type')).toBe('application/json');
    });

    it('uses provided headers for plain object', () => {
      // Prepare
      const obj = { message: 'success' };
      const headers = new Headers({ 'x-custom': 'value' });

      // Act
      const result = handlerResultToWebResponse(obj, {
        statusCode: HttpStatusCodes.OK,
        resHeaders: headers,
      });

      // Assess
      expect(result.headers.get('Content-Type')).toBe('application/json');
      expect(result.headers.get('x-custom')).toBe('value');
    });

    it('handles APIGatewayProxyResult with undefined headers', () => {
      // Prepare
      const proxyResult = {
        statusCode: HttpStatusCodes.OK,
        body: 'test',
        headers: undefined,
        isBase64Encoded: false,
      };

      // Act
      const result = handlerResultToWebResponse(proxyResult);

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpStatusCodes.OK);
    });

    it('handles APIGatewayProxyResult with undefined multiValueHeaders', () => {
      // Prepare
      const proxyResult = {
        statusCode: HttpStatusCodes.OK,
        body: 'test',
        headers: { 'content-type': 'text/plain' },
        multiValueHeaders: undefined,
        isBase64Encoded: false,
      };

      // Act
      const result = handlerResultToWebResponse(proxyResult);

      // Assess
      expect(result.status).toBe(HttpStatusCodes.OK);
      expect(result.headers.get('content-type')).toBe('text/plain');
    });

    it('handles APIGatewayProxyResult with undefined values in multiValueHeaders', () => {
      // Prepare
      const proxyResult = {
        statusCode: HttpStatusCodes.OK,
        body: 'test',
        headers: { 'content-type': 'text/plain' },
        multiValueHeaders: { 'Set-Cookie': undefined },
        isBase64Encoded: false,
      };

      // Act
      const result = handlerResultToWebResponse(proxyResult);

      // Assess
      expect(result.status).toBe(HttpStatusCodes.OK);
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
      const result = handlerResultToWebResponse(response, {
        statusCode: HttpStatusCodes.OK,
        resHeaders,
      });

      // Assess
      expect(result.status).toBe(HttpStatusCodes.OK);
      expect(result.headers.get('content-type')).toBe('text/plain');
      expect(result.headers.get('x-custom')).toBe('value');
      expect(result.text()).resolves.toBe('Hello');
    });

    it('returns Response object as-is when resHeaders is undefined', () => {
      // Prepare
      const response = new Response('Hello', {
        status: HttpStatusCodes.CREATED,
        headers: { 'content-type': 'text/plain' },
      });

      // Act
      const result = handlerResultToWebResponse(response);

      // Assess
      expect(result).toBe(response);
      expect(result.status).toBe(HttpStatusCodes.CREATED);
    });
  });

  describe('webHeadersToApiGatewayHeaders', () => {
    it('handles single-value headers', () => {
      // Prepare
      const headers = new Headers({
        'content-type': 'application/json',
        authorization: 'Bearer token123',
      });

      // Act
      const result = webHeadersToApiGatewayHeaders(headers, 'ApiGatewayV1');

      // Assess
      expect(result).toEqual({
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token123',
        },
        multiValueHeaders: {},
      });
    });

    it('handles multi-value headers split by comma', () => {
      // Prepare
      const headers = new Headers({
        accept: 'application/json, text/html',
        'cache-control': 'no-cache, no-store',
      });

      // Act
      const result = webHeadersToApiGatewayHeaders(headers, 'ApiGatewayV1');

      // Assess
      expect(result).toEqual({
        headers: {},
        multiValueHeaders: {
          accept: ['application/json', 'text/html'],
          'cache-control': ['no-cache', 'no-store'],
        },
      });
    });

    it('handles multi-value headers split by semicolon', () => {
      // Prepare
      const headers = new Headers({
        'set-cookie': 'session=abc123; theme=dark',
      });

      // Act
      const result = webHeadersToApiGatewayHeaders(headers, 'ApiGatewayV1');

      // Assess
      expect(result).toEqual({
        headers: {},
        multiValueHeaders: {
          'set-cookie': ['session=abc123', 'theme=dark'],
        },
      });
    });

    it('handles mixed comma and semicolon delimiters', () => {
      // Prepare
      const headers = new Headers({
        accept: 'application/json, text/html',
        'set-cookie': 'session=abc; theme=dark',
      });

      // Act
      const result = webHeadersToApiGatewayHeaders(headers, 'ApiGatewayV1');

      // Assess
      expect(result).toEqual({
        headers: {},
        multiValueHeaders: {
          accept: ['application/json', 'text/html'],
          'set-cookie': ['session=abc', 'theme=dark'],
        },
      });
    });

    it('handles duplicate header keys by accumulating values', () => {
      // Prepare
      const headers = new Headers();
      headers.append('x-custom', 'value1');
      headers.append('x-custom', 'value2');

      // Act
      const result = webHeadersToApiGatewayHeaders(headers, 'ApiGatewayV1');

      // Assess
      expect(result).toEqual({
        headers: {},
        multiValueHeaders: {
          'x-custom': ['value1', 'value2'],
        },
      });
    });

    it('moves header from headers to multiValueHeaders when duplicate appears', () => {
      // Prepare
      const headers = new Headers();
      headers.set('x-custom', 'value1');
      headers.append('x-custom', 'value2');

      // Act
      const result = webHeadersToApiGatewayHeaders(headers, 'ApiGatewayV1');

      // Assess
      expect(result).toEqual({
        headers: {},
        multiValueHeaders: {
          'x-custom': ['value1', 'value2'],
        },
      });
    });

    it('handles complex multi-value scenario with existing multiValueHeaders', () => {
      // Prepare
      const headers = new Headers();
      headers.append('accept', 'application/json');
      headers.append('accept', 'text/html');
      headers.append('accept', 'text/plain');

      // Act
      const result = webHeadersToApiGatewayHeaders(headers, 'ApiGatewayV1');

      // Assess
      expect(result).toEqual({
        headers: {},
        multiValueHeaders: {
          accept: ['application/json', 'text/html', 'text/plain'],
        },
      });
    });

    it('trims whitespace from start of split values', () => {
      // Prepare
      const headers = new Headers({
        accept: 'application/json,  text/html  ,text/plain',
        'set-cookie': 'session=abc;  theme=dark  ; user=john',
      });

      // Act
      const result = webHeadersToApiGatewayHeaders(headers, 'ApiGatewayV1');

      // Assess
      expect(result).toEqual({
        headers: {},
        multiValueHeaders: {
          accept: ['application/json', 'text/html  ', 'text/plain'],
          'set-cookie': ['session=abc', 'theme=dark  ', 'user=john'],
        },
      });
    });

    it('handles empty headers', () => {
      // Prepare
      const headers = new Headers();

      // Act
      const result = webHeadersToApiGatewayHeaders(headers, 'ApiGatewayV1');

      // Assess
      expect(result).toEqual({
        headers: {},
        multiValueHeaders: {},
      });
    });

    it('handles mixed single and multi-value headers', () => {
      // Prepare
      const headers = new Headers({
        'content-type': 'application/json',
        accept: 'application/json, text/html',
        authorization: 'Bearer token123',
        'set-cookie': 'session=abc; theme=dark',
      });

      // Act
      const result = webHeadersToApiGatewayHeaders(headers, 'ApiGatewayV1');

      // Assess
      expect(result).toEqual({
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token123',
        },
        multiValueHeaders: {
          accept: ['application/json', 'text/html'],
          'set-cookie': ['session=abc', 'theme=dark'],
        },
      });
    });
  });

  describe('bodyToNodeStream', () => {
    it('returns Node.js Readable stream as-is', () => {
      // Prepare
      const nodeStream = Readable.from(['Hello World']);

      // Act
      const result = bodyToNodeStream(nodeStream);

      // Assess
      expect(result).toBe(nodeStream);
    });

    it('converts Web ReadableStream to Node.js Readable stream', () => {
      // Prepare
      const webStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('Hello World'));
          controller.close();
        },
      });

      // Act
      const result = bodyToNodeStream(webStream);

      // Assess
      expect(result).toBeInstanceOf(Readable);
    });

    it('converts string body to Node.js Readable stream', async () => {
      // Prepare
      const stringBody = 'Hello World';

      // Act
      const stream = bodyToNodeStream(stringBody);

      // Assess
      expect(stream).toBeInstanceOf(Readable);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const result = Buffer.concat(chunks).toString();
      expect(result).toBe('Hello World');
    });
  });
});
