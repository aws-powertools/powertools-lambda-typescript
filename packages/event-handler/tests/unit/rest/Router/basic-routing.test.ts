import { Readable } from 'node:stream';
import context from '@aws-lambda-powertools/testing-utils/context';
import { describe, expect, it, vi } from 'vitest';
import { HttpStatusText } from '../../../../src/rest/constants.js';
import { InvalidEventError } from '../../../../src/rest/errors.js';
import {
  HttpStatusCodes,
  HttpVerbs,
  Router,
} from '../../../../src/rest/index.js';
import type { HttpMethod, RouteHandler } from '../../../../src/types/rest.js';
import {
  createTestALBEvent,
  createTestEvent,
  createTestEventV2,
} from '../helpers.js';

describe.each([
  { version: 'V1', createEvent: createTestEvent },
  { version: 'V2', createEvent: createTestEventV2 },
  { version: 'ALB', createEvent: createTestALBEvent },
])('Class: Router - Basic Routing ($version)', ({ createEvent }) => {
  const httpMethods = [
    ['GET', 'get'],
    ['POST', 'post'],
    ['PUT', 'put'],
    ['PATCH', 'patch'],
    ['DELETE', 'delete'],
    ['HEAD', 'head'],
    ['OPTIONS', 'options'],
  ];
  it.each(httpMethods)(
    'routes %s requests with object response',
    async (method, verb) => {
      // Prepare
      const app = new Router();
      (
        app[verb as Lowercase<HttpMethod>] as (
          path: string,
          handler: RouteHandler
        ) => void
      )('/test', async () => ({ result: `${verb}-test` }));

      // Act
      const actual = await app.resolve(createEvent('/test', method), context);

      // Assess
      expect(actual.statusCode).toBe(200);
      expect(actual.body).toBe(JSON.stringify({ result: `${verb}-test` }));
      expect(actual.headers?.['content-type']).toBe('application/json');
      expect(actual.isBase64Encoded).toBe(false);
    }
  );

  it.each(httpMethods)(
    'routes %s requests with array response',
    async (method, verb) => {
      // Prepare
      const app = new Router();
      (
        app[verb as Lowercase<HttpMethod>] as (
          path: string,
          handler: RouteHandler
        ) => void
      )('/test', async () => [
        { id: 1, result: `${verb}-test-1` },
        { id: 2, result: `${verb}-test-2` },
      ]);

      // Act
      const actual = await app.resolve(createEvent('/test', method), context);

      // Assess
      expect(actual.statusCode).toBe(200);
      expect(actual.body).toBe(
        JSON.stringify([
          { id: 1, result: `${verb}-test-1` },
          { id: 2, result: `${verb}-test-2` },
        ])
      );
      expect(actual.headers?.['content-type']).toBe('application/json');
      expect(actual.isBase64Encoded).toBe(false);
    }
  );

  it.each([['CONNECT'], ['TRACE']])(
    'throws MethodNotAllowedError for %s requests',
    async (method) => {
      // Prepare
      const app = new Router();

      // Act & Assess
      const result = await app.resolve(createEvent('/test', method), context);

      expect(result.statusCode).toBe(HttpStatusCodes.METHOD_NOT_ALLOWED);
      expect(result.body ?? '').toBe('');
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
      createEvent('/test', HttpVerbs.GET),
      context
    );
    const postResult = await app.resolve(
      createEvent('/test', HttpVerbs.POST),
      context
    );

    // Assess
    expect(getResult.statusCode).toBe(200);
    expect(getResult.body).toBe(JSON.stringify({ result: 'route-test' }));
    expect(getResult.headers?.['content-type']).toBe('application/json');
    expect(getResult.isBase64Encoded).toBe(false);

    expect(postResult.statusCode).toBe(200);
    expect(postResult.body).toBe(JSON.stringify({ result: 'route-test' }));
    expect(postResult.headers?.['content-type']).toBe('application/json');
    expect(postResult.isBase64Encoded).toBe(false);
  });

  it('passes request, event, and context to functional route handlers', async () => {
    // Prepare
    const app = new Router();
    const testEvent = createEvent('/test', 'GET');

    app.get('/test', (reqCtx) => {
      return {
        hasRequest: reqCtx.req instanceof Request,
        hasEvent: reqCtx.event === testEvent,
        hasContext: reqCtx.context === context,
      };
    });

    // Act
    const result = await app.resolve(testEvent, context);
    const actual = JSON.parse(result.body ?? '{}');

    // Assess
    expect(actual.hasRequest).toBe(true);
    expect(actual.hasEvent).toBe(true);
    expect(actual.hasContext).toBe(true);
  });

  it('throws an invalid event error for non-API Gateway events', async () => {
    // Prepare
    const app = new Router();
    const nonApiGatewayEvent = { Records: [] }; // SQS-like event

    // Act & Assess
    await expect(app.resolve(nonApiGatewayEvent, context)).rejects.toThrowError(
      InvalidEventError
    );
  });

  it('routes to the prefixed path when having a shared prefix defined', async () => {
    // Prepare
    const app = new Router({
      prefix: '/todos',
    });
    app.post('/', () => {
      return { actualPath: '/todos' };
    });
    app.get('/:todoId', (reqCtx) => {
      return { actualPath: `/todos/${reqCtx.params.todoId}` };
    });

    // Act
    const createResult = await app.resolve(
      createEvent('/todos', 'POST'),
      context
    );
    const getResult = await app.resolve(
      createEvent('/todos/1', 'GET'),
      context
    );

    // Assess
    expect(JSON.parse(createResult.body ?? '{}').actualPath).toBe('/todos');
    expect(JSON.parse(getResult.body ?? '{}').actualPath).toBe('/todos/1');
  });

  it('routes to the included router when using split routers', async () => {
    // Prepare
    const todoRouter = new Router({ logger: console });
    todoRouter.use(async ({ next }) => {
      console.log('todoRouter middleware');
      await next();
    });
    todoRouter.get('/', async () => ({ api: 'listTodos' }));
    todoRouter.notFound(async () => ({
      error: 'Route not found',
    }));
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
    const rootResult = await app.resolve(createEvent('/', 'GET'), context);
    const listTodosResult = await app.resolve(
      createEvent('/todos', 'GET'),
      context
    );
    const notFoundResult = await app.resolve(
      createEvent('/non-existent', 'GET'),
      context
    );

    // Assert
    expect(JSON.parse(rootResult.body ?? '{}').api).toEqual('root');
    expect(JSON.parse(listTodosResult.body ?? '{}').api).toEqual('listTodos');
    expect(JSON.parse(notFoundResult.body ?? '{}').error).toEqual(
      'Route not found'
    );
    expect(consoleLogSpy).toHaveBeenNthCalledWith(1, 'app middleware');
    expect(consoleLogSpy).toHaveBeenNthCalledWith(2, 'todoRouter middleware');
    expect(consoleWarnSpy).toHaveBeenNthCalledWith(
      1,
      'Handler for method: GET and path: /todos already exists. The previous handler will be replaced.'
    );
  });

  it.each([
    ['/files/test', 'GET', 'serveFileOverride'],
    ['/api/v1/test', 'GET', 'apiVersioning'],
    ['/users/1/files/test', 'GET', 'dynamicRegex1'],
    ['/any-route', 'GET', 'getAnyRoute'],
    ['/no-matches', 'POST', 'catchAllUnmatched'],
  ])('routes %s %s to %s handler', async (path, method, expectedApi) => {
    // Prepare
    const app = new Router();
    app.get(/\/files\/.+/, async () => ({ api: 'serveFile' }));
    app.get(/\/files\/.+/, async () => ({ api: 'serveFileOverride' }));
    app.get(/\/api\/v\d+\/.*/, async () => ({ api: 'apiVersioning' }));
    app.get(/\/users\/:userId\/files\/.+/, async (reqCtx) => ({
      api: `dynamicRegex${reqCtx.params.userId}`,
    }));
    app.get(/.+/, async () => ({ api: 'getAnyRoute' }));
    app.route(async () => ({ api: 'catchAllUnmatched' }), {
      path: /.*/,
      method: [HttpVerbs.GET, HttpVerbs.POST],
    });

    // Act
    const result = await app.resolve(createEvent(path, method), context);

    // Assess
    expect(JSON.parse(result.body ?? '{}').api).toEqual(expectedApi);
  });
});

describe('Class: Router - V1 Multivalue Headers Support', () => {
  it('handles ExtendedAPIGatewayProxyResult with multiValueHeaders field', async () => {
    // Prepare
    const app = new Router();
    app.get('/test', () => ({
      statusCode: 200,
      body: JSON.stringify({ message: 'success' }),
      headers: { 'content-type': 'application/json' },
      multiValueHeaders: { 'set-cookie': ['session=abc123', 'theme=dark'] },
    }));

    // Act
    const result = await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: 'success' }),
      headers: { 'content-type': 'application/json' },
      multiValueHeaders: { 'set-cookie': ['session=abc123', 'theme=dark'] },
      isBase64Encoded: false,
    });
  });
});

describe('Class: Router - V2 Cookies Support', () => {
  it('handles ExtendedAPIGatewayProxyResult with cookies field', async () => {
    // Prepare
    const app = new Router();
    app.get('/test', () => ({
      statusCode: 200,
      body: JSON.stringify({ message: 'success' }),
      headers: { 'content-type': 'application/json' },
      cookies: ['session=abc123', 'theme=dark'],
    }));

    // Act
    const result = await app.resolve(
      createTestEventV2('/test', 'GET'),
      context
    );

    // Assess
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: 'success' }),
      headers: { 'content-type': 'application/json' },
      cookies: ['session=abc123', 'theme=dark'],
      isBase64Encoded: false,
    });
  });
});

describe('Class: Router - ALB Support', () => {
  it('handles ALB event with statusDescription', async () => {
    // Prepare
    const app = new Router();
    app.get('/test', () => ({ message: 'success' }));

    // Act
    const result = await app.resolve(
      createTestALBEvent('/test', 'GET'),
      context
    );

    // Assess
    expect(result).toEqual({
      statusCode: 200,
      statusDescription: '200 OK',
      body: JSON.stringify({ message: 'success' }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it('handles ALB event with multiValueHeaders', async () => {
    // Prepare
    const app = new Router();
    app.get('/test', () => ({
      statusCode: 200,
      body: JSON.stringify({ message: 'success' }),
      headers: { 'content-type': 'application/json' },
      multiValueHeaders: { 'set-cookie': ['session=abc123', 'theme=dark'] },
    }));

    // Act
    const result = await app.resolve(
      createTestALBEvent('/test', 'GET'),
      context
    );

    // Assess
    expect(result).toEqual({
      statusCode: 200,
      statusDescription: '200 OK',
      body: JSON.stringify({ message: 'success' }),
      headers: { 'content-type': 'application/json' },
      multiValueHeaders: { 'set-cookie': ['session=abc123', 'theme=dark'] },
      isBase64Encoded: false,
    });
  });

  it('handles ALB POST request with body', async () => {
    // Prepare
    const app = new Router();
    app.post('/test', async ({ req }) => {
      const body = await req.json();
      return { received: body };
    });

    // Act
    const result = await app.resolve(
      createTestALBEvent('/test', 'POST', {}, { data: 'test' }),
      context
    );

    // Assess
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ received: { data: 'test' } }));
  });

  it.each(
    Object.entries(HttpStatusText).map(([code, text]) => ({
      statusCode: Number(code),
      expectedDescription: `${code} ${text}`,
    }))
  )(
    'returns statusDescription "$expectedDescription" for status code $statusCode',
    async ({ statusCode, expectedDescription }) => {
      // Prepare
      const app = new Router();
      const noBodyStatuses = new Set([201, 204, 205, 304]);
      const body = noBodyStatuses.has(statusCode)
        ? null
        : JSON.stringify({ status: statusCode });
      app.get('/test', () => new Response(body, { status: statusCode }));

      // Act
      const result = await app.resolve(
        createTestALBEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result.statusCode).toBe(statusCode);
      expect(result).toHaveProperty('statusDescription', expectedDescription);
      if (!noBodyStatuses.has(statusCode)) {
        expect(result.body).toBe(JSON.stringify({ status: statusCode }));
      }
    }
  );
});

describe.each([
  { version: 'V1', createEvent: createTestEvent },
  { version: 'V2', createEvent: createTestEventV2 },
  { version: 'ALB', createEvent: createTestALBEvent },
])('Class: Router - Binary Result ($version)', ({ createEvent }) => {
  it('handles ArrayBuffer as direct return type', async () => {
    // Prepare
    const app = new Router();
    const { buffer } = new TextEncoder().encode('binary data');
    app.get('/binary', () => buffer);

    // Act
    const result = await app.resolve(createEvent('/binary', 'GET'), context);

    // Assess
    expect(result.body).toBe(Buffer.from(buffer).toString('base64'));
    expect(result.isBase64Encoded).toBe(true);
  });

  it('handles Readable stream as direct return type', async () => {
    // Prepare
    const app = new Router();
    const data = Buffer.concat([Buffer.from('chunk1'), Buffer.from('chunk2')]);
    const stream = Readable.from([
      Buffer.from('chunk1'),
      Buffer.from('chunk2'),
    ]);
    app.get('/stream', () => stream);

    // Act
    const result = await app.resolve(createEvent('/stream', 'GET'), context);

    // Assess
    expect(result.body).toBe(data.toString('base64'));
    expect(result.isBase64Encoded).toBe(true);
  });

  it('handles ReadableStream as direct return type', async () => {
    // Prepare
    const app = new Router();
    const data = new TextEncoder().encode('data');
    const webStream = new ReadableStream({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });
    app.get('/webstream', () => webStream);

    // Act
    const result = await app.resolve(createEvent('/webstream', 'GET'), context);

    // Assess
    expect(result.body).toBe(Buffer.from(data).toString('base64'));
    expect(result.isBase64Encoded).toBe(true);
  });

  it.each([['image/png'], ['image/jpeg'], ['audio/mpeg'], ['video/mp4']])(
    'sets isBase64Encoded for %s content-type',
    async (contentType) => {
      // Prepare
      const app = new Router();
      app.get(
        '/media',
        () =>
          new Response('binary data', {
            headers: { 'content-type': contentType },
          })
      );

      // Act
      const result = await app.resolve(createEvent('/media', 'GET'), context);

      // Assess
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(Buffer.from('binary data').toString('base64'));
      expect(result.headers?.['content-type']).toBe(contentType);
      expect(result.isBase64Encoded).toBe(true);
    }
  );

  it('does not set isBase64Encoded for text content-types', async () => {
    // Prepare
    const app = new Router();
    app.get(
      '/text',
      () =>
        new Response('text data', {
          headers: { 'content-type': 'text/plain' },
        })
    );

    // Act
    const result = await app.resolve(createEvent('/text', 'GET'), context);

    // Assess
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('text data');
    expect(result.headers?.['content-type']).toBe('text/plain');
    expect(result.isBase64Encoded).toBe(false);
  });
});
