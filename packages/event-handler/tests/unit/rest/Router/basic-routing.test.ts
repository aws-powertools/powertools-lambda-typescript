import context from '@aws-lambda-powertools/testing-utils/context';
import { describe, expect, it } from 'vitest';
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
    const baseRouter = new Router();
    baseRouter.get('/', async () => ({ api: 'root' }));
    baseRouter.get('/version', async () => ({ api: 'listVersions' }));
    baseRouter.get('/version/:id', async () => ({ api: 'getVersion' }));
    baseRouter.notFound(async () => ({ error: 'NotFound' }));

    const todoRouter = new Router();
    todoRouter.get('/', async () => ({ api: 'listTodos' }));
    todoRouter.post('/create', async () => ({ api: 'createTodo' }));
    todoRouter.get('/:id', async () => ({ api: 'getTodo' }));

    const taskRouter = new Router();
    taskRouter.get('/', async () => ({ api: 'listTasks' }));
    taskRouter.post('/create', async () => ({ api: 'createTask' }));
    taskRouter.get('/:taskId', async () => ({ api: 'getTask' }));

    const app = new Router();
    app.includeRouter(baseRouter);
    app.includeRouter(todoRouter, { prefix: '/todos' });
    app.includeRouter(taskRouter, { prefix: '/todos/:id/tasks' });

    // Act & Assess
    const testCases = [
      ['/', 'GET', 'api', 'root'],
      ['/version', 'GET', 'api', 'listVersions'],
      ['/version/1', 'GET', 'api', 'getVersion'],
      ['/todos', 'GET', 'api', 'listTodos'],
      ['/todos/create', 'POST', 'api', 'createTodo'],
      ['/todos/1', 'GET', 'api', 'getTodo'],
      ['/todos/1/tasks', 'GET', 'api', 'listTasks'],
      ['/todos/1/tasks/create', 'POST', 'api', 'createTask'],
      ['/todos/1/tasks/1', 'GET', 'api', 'getTask'],
      ['/non-existent', 'GET', 'error', 'NotFound'],
    ] as const;

    for (const [path, method, key, expected] of testCases) {
      const result = await app.resolve(createTestEvent(path, method), context);
      expect(JSON.parse(result.body)[key]).toBe(expected);
    }
  });
});
