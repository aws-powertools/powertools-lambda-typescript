import type { APIGatewayProxyEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { proxyEventToWebRequest } from '../../../src/rest/converters.js';

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

  it('should convert basic GET request', () => {
    const request = proxyEventToWebRequest(baseEvent);

    expect(request).toBeInstanceOf(Request);
    expect(request.method).toBe('GET');
    expect(request.url).toBe('http://api.example.com/test');
    expect(request.body).toBe(null);
  });

  it('should use Host header over domainName', () => {
    const event = {
      ...baseEvent,
      headers: { Host: 'custom.example.com' },
    };

    const request = proxyEventToWebRequest(event);
    expect(request).toBeInstanceOf(Request);
    expect(request.url).toBe('http://custom.example.com/test');
  });

  it('should use X-Forwarded-Proto header for protocol', () => {
    const event = {
      ...baseEvent,
      headers: { 'X-Forwarded-Proto': 'https' },
    };

    const request = proxyEventToWebRequest(event);
    expect(request).toBeInstanceOf(Request);
    expect(request.url).toBe('https://api.example.com/test');
  });

  it('should handle null values in multiValueHeaders arrays', () => {
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

  it('should handle null values in multiValueQueryStringParameters arrays', () => {
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

  it('should handle POST request with string body', async () => {
    const event = {
      ...baseEvent,
      httpMethod: 'POST',
      requestContext: {
        ...baseEvent.requestContext,
        httpMethod: 'POST',
      },
      body: '{"key":"value"}',
      headers: { 'Content-Type': 'application/json' },
    };

    const request = proxyEventToWebRequest(event);
    expect(request).toBeInstanceOf(Request);
    expect(request.method).toBe('POST');
    expect(await request.text()).toBe('{"key":"value"}');
    expect(request.headers.get('Content-Type')).toBe('application/json');
  });

  it('should decode base64 encoded body', async () => {
    const originalText = 'Hello World';
    const base64Text = Buffer.from(originalText).toString('base64');

    const event = {
      ...baseEvent,
      httpMethod: 'POST',
      requestContext: {
        ...baseEvent.requestContext,
        httpMethod: 'POST',
      },
      body: base64Text,
      isBase64Encoded: true,
    };

    const request = proxyEventToWebRequest(event);
    expect(request).toBeInstanceOf(Request);
    expect(await request.text()).toBe(originalText);
  });

  it('should handle single-value headers', () => {
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

  it('should handle multiValueHeaders', () => {
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

  it('should handle both single and multi-value headers', () => {
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

  it('should handle queryStringParameters', () => {
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

  it('should handle multiValueQueryStringParameters', () => {
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

  it('should handle both queryStringParameters and multiValueQueryStringParameters', () => {
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

  it('should skip null queryStringParameter values', () => {
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

  it('should skip null header values', () => {
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

  it('should handle null/undefined collections', () => {
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
    expect(request.url).toBe('http://api.example.com/test');
  });
});
