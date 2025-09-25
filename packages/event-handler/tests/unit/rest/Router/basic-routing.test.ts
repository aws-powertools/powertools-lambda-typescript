import context from '@aws-lambda-powertools/testing-utils/context';
import { describe, expect, it, vi } from 'vitest';
import {
  HttpStatusCodes,
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

      expect(result.statusCode).toBe(HttpStatusCodes.METHOD_NOT_ALLOWED);
      expect(result.body).toEqual('');
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

    app.get('/test', async (reqCtx) => {
      return {
        hasRequest: reqCtx.req instanceof Request,
        hasEvent: reqCtx.event === testEvent,
        hasContext: reqCtx.context === context,
      };
    });

    // Act
    const result = await app.resolve(testEvent, context);
    const actual = JSON.parse(result.body);

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

  it('routes to the prefixed path when having a shared prefix defined', async () => {
    // Prepare
    const app = new Router({
      prefix: '/todos',
    });
    app.post('/', async () => {
      return { actualPath: '/todos' };
    });
    app.get('/:todoId', async (reqCtx) => {
      return { actualPath: `/todos/${reqCtx.params.todoId}` };
    });

    // Act
    const createResult = await app.resolve(
      createTestEvent('/todos', 'POST'),
      context
    );
    const getResult = await app.resolve(
      createTestEvent('/todos/1', 'GET'),
      context
    );

    // Assess
    expect(JSON.parse(createResult.body).actualPath).toBe('/todos');
    expect(JSON.parse(getResult.body).actualPath).toBe('/todos/1');
  });

  it('routes to the included router when using split routers', async () => {
    // Prepare
    const todoRouter = new Router({ logger: console });
    todoRouter.use(async ({ next }) => {
      console.log('todoRouter middleware');
      await next();
    });
    todoRouter.get('/', async () => ({ api: 'listTodos' }));
    todoRouter.notFound(async () => {
      return {
        error: 'Route not found',
      };
    });
    const consoleLogSpy = vi.spyOn(console, 'log');
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    const app = new Router();
    app.use(async ({ next }) => {
      console.log('app middleware');
      await next();
    });
    app.get('/todos', async () => ({ api: 'rootTodos' }));
    app.get('/', async () => ({ api: 'root' }));
    app.includeRouter(todoRouter, { prefix: '/todos' });

    // Act
    const rootResult = await app.resolve(createTestEvent('/', 'GET'), context);
    const listTodosResult = await app.resolve(
      createTestEvent('/todos', 'GET'),
      context
    );
    const notFoundResult = await app.resolve(
      createTestEvent('/non-existent', 'GET'),
      context
    );

    // Assert
    expect(JSON.parse(rootResult.body).api).toEqual('root');
    expect(JSON.parse(listTodosResult.body).api).toEqual('listTodos');
    expect(JSON.parse(notFoundResult.body).error).toEqual('Route not found');
    expect(consoleLogSpy).toHaveBeenNthCalledWith(1, 'app middleware');
    expect(consoleLogSpy).toHaveBeenNthCalledWith(2, 'todoRouter middleware');
    expect(consoleWarnSpy).toHaveBeenNthCalledWith(
      1,
      'Handler for method: GET and path: /todos already exists. The previous handler will be replaced.'
    );
  });
});
