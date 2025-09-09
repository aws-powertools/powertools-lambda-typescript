import context from '@aws-lambda-powertools/testing-utils/context';
import { describe, expect, it } from 'vitest';
import {
  HttpErrorCodes,
  HttpVerbs,
  InternalServerError,
  Router,
} from '../../../../src/rest/index.js';
import type { HttpMethod, RouteHandler } from '../../../../src/types/rest.js';
import { createTestEvent } from '../helpers.js';

describe('Class: Router - Basic Routing', () => {
  it.each([
    ['GET', 'get'],
    ['POST', 'post'],
    ['PUT', 'put'],
    ['PATCH', 'patch'],
    ['DELETE', 'delete'],
    ['HEAD', 'head'],
    ['OPTIONS', 'options'],
  ])('routes %s requests', async (method, verb) => {
    // Prepare
    const app = new Router();
    (
      app[verb as Lowercase<HttpMethod>] as (
        path: string,
        handler: RouteHandler
      ) => void
    )('/test', async () => ({ result: `${verb}-test` }));
    // Act
    const actual = await app.resolve(createTestEvent('/test', method), context);
    // Assess
    expect(actual).toEqual({
      statusCode: 200,
      body: JSON.stringify({ result: `${verb}-test` }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it.each([['CONNECT'], ['TRACE']])(
    'throws MethodNotAllowedError for %s requests',
    async (method) => {
      // Prepare
      const app = new Router();

      // Act & Assess
      const result = await app.resolve(
        createTestEvent('/test', method),
        context
      );

      expect(result?.statusCode).toBe(HttpErrorCodes.METHOD_NOT_ALLOWED);
      expect(result?.body).toEqual('');
    }
  );

  it('accepts multiple HTTP methods', async () => {
    // Act
    const app = new Router();
    app.route(async () => ({ result: 'route-test' }), {
      path: '/test',
      method: [HttpVerbs.GET, HttpVerbs.POST],
    });

    // Act
    const getResult = await app.resolve(
      createTestEvent('/test', HttpVerbs.GET),
      context
    );
    const postResult = await app.resolve(
      createTestEvent('/test', HttpVerbs.POST),
      context
    );

    // Assess
    const expectedResult = {
      statusCode: 200,
      body: JSON.stringify({ result: 'route-test' }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    };
    expect(getResult).toEqual(expectedResult);
    expect(postResult).toEqual(expectedResult);
  });

  it('passes request, event, and context to functional route handlers', async () => {
    // Prepare
    const app = new Router();
    const testEvent = createTestEvent('/test', 'GET');

    app.get('/test', async (_params, options) => {
      return {
        hasRequest: options.request instanceof Request,
        hasEvent: options.event === testEvent,
        hasContext: options.context === context,
      };
    });

    // Act
    const result = await app.resolve(testEvent, context);
    const actual = JSON.parse(result?.body ?? '{}');

    // Assess
    expect(actual.hasRequest).toBe(true);
    expect(actual.hasEvent).toBe(true);
    expect(actual.hasContext).toBe(true);
  });

  it('throws an internal server error for non-API Gateway events', async () => {
    // Prepare
    const app = new Router();
    const nonApiGatewayEvent = { Records: [] }; // SQS-like event

    // Act & Assess
    expect(app.resolve(nonApiGatewayEvent, context)).rejects.toThrowError(
      InternalServerError
    );
  });
});
