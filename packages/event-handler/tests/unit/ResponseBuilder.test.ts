/**
 * ResponseBuilder tests
 *
 * @group unit/event-handler/class/responsebuilder/all
 */
import zlib from 'node:zlib';
import { APIGatewayProxyEvent, APIGatewayProxyEventHeaders } from 'aws-lambda';
import { ResponseBuilder } from '../../src/ApiGateway';
import { CORSConfig, Response, Route, Headers, AsyncFunction } from '../../src';

describe('Class: ResponseBuilder', () => {
  const testFunc: AsyncFunction<string> = (_args: unknown): Promise<string> =>
    Promise.resolve('');

  const testOrigin = 'test_origin';
  const allowHeaders = ['test_header'];
  const cacheControl = 'no-store';

  describe('Feature: CORS Handling', () => {
    test('should provide a basic response if there is no route specific configuration', () => {
      const event = {
        httpMethod: 'GET',
        path: '/test',
        body: null,
        headers: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const response = new Response(200);
      const responseBuilder = new ResponseBuilder(response);
      const corsConfig = new CORSConfig(testOrigin, allowHeaders);
      const jsonData = responseBuilder.build(event, corsConfig);
      expect(jsonData).toBeDefined();
      if (jsonData) {
        expect(jsonData['statusCode']).toEqual(200);
        expect(jsonData['isBase64Encoded']).toEqual(false);
        const headers = jsonData['headers'] as Headers;
        expect(headers).toBeDefined();
        if (headers) {
          expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
          expect(headers['Access-Control-Allow-Headers']).toBeUndefined();
          expect(headers['Cache-Control']).toBeUndefined();
          expect(headers['Content-Encoding']).toBeUndefined();
        }
      }
    });

    test('should add cors headers if the route has CORS configuration', () => {
      const event = {
        httpMethod: 'GET',
        path: '/test',
        body: null,
        headers: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route('GET', '/test', testFunc, true, false);
      const response = new Response(200);
      const responseBuilder = new ResponseBuilder(response, route);
      const corsConfig = new CORSConfig(testOrigin, allowHeaders);
      const jsonData = responseBuilder.build(event, corsConfig);
      expect(jsonData).toBeDefined();
      if (jsonData) {
        const headers = jsonData['headers'] as Headers;
        expect(headers).toBeDefined();
        if (headers) {
          expect(headers['Access-Control-Allow-Origin']).toEqual(testOrigin);
          expect(headers['Access-Control-Allow-Headers']).toBeDefined();
        }
      }
    });

    test('should not cors headers if the route has no CORS configuration', () => {
      const event = {
        httpMethod: 'GET',
        path: '/test',
        body: null,
        headers: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route('GET', '/test', testFunc, true, false);
      const response = new Response(200);
      const responseBuilder = new ResponseBuilder(response, route);
      const jsonData = responseBuilder.build(event);
      expect(jsonData).toBeDefined();
      if (jsonData) {
        const headers = jsonData['headers'] as Headers;
        expect(headers).toBeDefined();
        if (headers) {
          expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
          expect(headers['Access-Control-Allow-Headers']).toBeUndefined();
        }
      }
    });

    test('should add cache-control headers for HTTP OK if the route has cache-control enabled', () => {
      const event = {
        httpMethod: 'GET',
        path: '/test',
        body: null,
        headers: {
          'test-header': 'header-value',
        } as APIGatewayProxyEventHeaders,
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route(
        'GET',
        '/test',
        testFunc,
        false,
        false,
        cacheControl
      );
      const response = new Response(200);
      const responseBuilder = new ResponseBuilder(response, route);
      const corsConfig = new CORSConfig(testOrigin, allowHeaders);
      const jsonData = responseBuilder.build(event, corsConfig);
      expect(jsonData).toBeDefined();
      if (jsonData) {
        const headers = jsonData['headers'] as Headers;
        expect(headers).toBeDefined();
        if (headers) {
          expect(headers['Cache-Control']).toEqual(cacheControl);
        }
      }
    });

    test('should add no-cache header for non success response', () => {
      const event = {
        httpMethod: '',
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route(
        'GET',
        '/test',
        testFunc,
        false,
        false,
        cacheControl
      );
      const response = new Response(500);
      const responseBuilder = new ResponseBuilder(response, route);
      const corsConfig = new CORSConfig(testOrigin, allowHeaders);
      const jsonData = responseBuilder.build(event, corsConfig);
      expect(jsonData).toBeDefined();
      if (jsonData) {
        const headers = jsonData['headers'] as Headers;
        expect(headers).toBeDefined();
        if (headers) {
          expect(headers['Cache-Control']).toEqual('no-cache');
        }
      }
    });

    test('should not add cache-control header if route config has no cache-control', () => {
      const event = {
        httpMethod: 'GET',
        path: '/test',
        body: null,
        headers: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route('GET', '/test', testFunc, false, false);
      const response = new Response(500);
      const responseBuilder = new ResponseBuilder(response, route);
      const corsConfig = new CORSConfig(testOrigin, allowHeaders);
      const jsonData = responseBuilder.build(event, corsConfig);
      expect(jsonData).toBeDefined();
      if (jsonData) {
        const headers = jsonData['headers'] as Headers;
        expect(headers).toBeDefined();
        if (headers) {
          expect(headers['Cache-Control']).toBeUndefined();
        }
      }
    });

    test('should base64 encode body if the payload is a string', () => {
      const event = {
        httpMethod: 'GET',
        path: '/test',
        body: null,
        headers: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route('GET', '/test', testFunc);
      const stringBody = '{"message":"ok"}';
      const response = new Response(500, 'application.json', stringBody);
      const responseBuilder = new ResponseBuilder(response, route);
      const corsConfig = new CORSConfig(testOrigin, allowHeaders);
      const jsonData = responseBuilder.build(event, corsConfig);
      expect(jsonData).toBeDefined();
      if (jsonData) {
        expect(jsonData['isBase64Encoded']).toBeDefined();
        expect(jsonData['isBase64Encoded']).toEqual(false);
        expect(jsonData['body']).toEqual(stringBody);
      }
    });

    test('should not base64 encode body if the payload is not a string type', () => {
      const event = {
        httpMethod: 'GET',
        path: '/test',
        body: null,
        headers: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route('GET', '/test', testFunc);
      const stringBody = '{"message":"ok"}';
      const response = new Response(
        500,
        'application.json',
        JSON.parse(stringBody)
      );
      const responseBuilder = new ResponseBuilder(response, route);
      const corsConfig = new CORSConfig(testOrigin, allowHeaders);
      const jsonData = responseBuilder.build(event, corsConfig);
      expect(jsonData).toBeDefined();
      if (jsonData) {
        expect(jsonData['isBase64Encoded']).toBeDefined();
        expect(jsonData['isBase64Encoded']).toEqual(false);
      }
    });

    test('should compress body if the compress enabled in route config and accept-encoding is gzip', () => {
      const event = {
        httpMethod: 'GET',
        path: '/test',
        body: 'hello',
        headers: {
          'accept-encoding': 'gzip',
        } as Headers,
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route('GET', '/test', testFunc, false, true);
      const stringBody = '{"message":"ok"}';
      const response = new Response(200, 'application.json', stringBody);
      const responseBuilder = new ResponseBuilder(response, route);
      const corsConfig = new CORSConfig(testOrigin, allowHeaders);
      const jsonData = responseBuilder.build(event, corsConfig);
      expect(jsonData).toBeDefined();
      if (jsonData) {
        expect(jsonData['isBase64Encoded']).toBeDefined();
        expect(jsonData['isBase64Encoded']).toEqual(true);
        const headers = jsonData['headers'] as Headers;
        expect(headers).toBeDefined();
        if (headers) {
          expect(headers['Content-Encoding']).toEqual('gzip');
        }
        expect(
          zlib
            .gunzipSync(Buffer.from(jsonData['body'] as string, 'base64'))
            .toString('utf8')
        ).toEqual(stringBody);
      }
    });

    test('should not compress body if the compress enabled in route config and accept-encoding is not gzip', () => {
      const event = {
        httpMethod: 'GET',
        path: '/test',
        body: null,
        headers: {
          'accept-encoding': 'br',
        } as Headers,
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route('GET', '/test', testFunc, false, true);
      const stringBody = '{"message":"ok"}';
      const response = new Response(200, 'application.json', stringBody);
      const responseBuilder = new ResponseBuilder(response, route);
      const corsConfig = new CORSConfig(testOrigin, allowHeaders);
      const jsonData = responseBuilder.build(event, corsConfig);
      expect(jsonData).toBeDefined();
      if (jsonData) {
        expect(jsonData['isBase64Encoded']).toBeDefined();
        expect(jsonData['isBase64Encoded']).toEqual(false);
        const headers = jsonData['headers'] as Headers;
        expect(headers).toBeDefined();
        if (headers) {
          expect(headers['Content-Encoding']).toBeUndefined();
        }
        expect(jsonData['body']).toEqual(stringBody);
      }
    });
  });
});
