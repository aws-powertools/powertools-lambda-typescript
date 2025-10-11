import { Duplex, PassThrough, Readable } from 'node:stream';
import context from '@aws-lambda-powertools/testing-utils/context';
import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '../../../../src/rest/errors.js';
import { Router } from '../../../../src/rest/index.js';
import {
  createTestEvent,
  MockResponseStream,
  parseStreamOutput,
} from '../helpers.js';

describe('Class: Router - Streaming', () => {
  it('streams a simple JSON response', async () => {
    // Prepare
    const app = new Router();
    app.get('/test', async () => ({ message: 'Hello, World!' }));

    // Create a mock ResponseStream
    const responseStream = new MockResponseStream();

    // Act
    await app.resolveStream(createTestEvent('/test', 'GET'), context, {
      responseStream,
    });

    // Assess
    const { prelude, body } = parseStreamOutput(responseStream.chunks);
    expect(prelude.statusCode).toBe(200);
    expect(JSON.parse(body)).toEqual({ message: 'Hello, World!' });
  });

  it('streams a Response object', async () => {
    // Prepare
    const app = new Router();
    app.get('/test', () => {
      return new Response(JSON.stringify({ data: 'test' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Create a mock ResponseStream
    const responseStream = new MockResponseStream();

    // Act
    await app.resolveStream(createTestEvent('/test', 'GET'), context, {
      responseStream,
    });

    // Assess
    const { prelude, body } = parseStreamOutput(responseStream.chunks);
    expect(prelude.statusCode).toBe(201);
    expect(JSON.parse(body)).toEqual({ data: 'test' });
  });

  it('handles route not found', async () => {
    // Prepare
    const app = new Router();
    const responseStream = new MockResponseStream();

    // Act
    await app.resolveStream(createTestEvent('/nonexistent', 'GET'), context, {
      responseStream,
    });

    // Assess
    const { prelude, body } = parseStreamOutput(responseStream.chunks);
    expect(prelude.statusCode).toBe(404);
    const parsedBody = JSON.parse(body);
    expect(parsedBody.statusCode).toBe(404);
  });

  it('works with middleware', async () => {
    // Prepare
    const app = new Router();

    // Add middleware that modifies the response
    app.use(async ({ reqCtx, next }) => {
      await next();
      reqCtx.res.headers.set('X-Custom-Header', 'test-value');
    });

    app.get('/test', () => ({ message: 'middleware test' }));

    const responseStream = new MockResponseStream();

    // Act
    await app.resolveStream(createTestEvent('/test', 'GET'), context, {
      responseStream,
    });

    // Assess
    const { prelude, body } = parseStreamOutput(responseStream.chunks);
    expect(prelude.statusCode).toBe(200);
    expect(prelude.headers['x-custom-header']).toBe('test-value');
    expect(JSON.parse(body)).toEqual({ message: 'middleware test' });
  });

  it('handles thrown errors', async () => {
    // Prepare
    const app = new Router();
    app.get('/test', () => {
      throw new UnauthorizedError('Access denied');
    });

    const responseStream = new MockResponseStream();

    // Act
    await app.resolveStream(createTestEvent('/test', 'GET'), context, {
      responseStream,
    });

    // Assess
    const { prelude, body } = parseStreamOutput(responseStream.chunks);
    expect(prelude.statusCode).toBe(401);
    const parsedBody = JSON.parse(body);
    expect(parsedBody.message).toBe('Access denied');
  });

  it('works with error handlers', async () => {
    // Prepare
    const app = new Router();

    app.errorHandler(UnauthorizedError, async (error) => ({
      statusCode: 401,
      message: `Custom: ${error.message}`,
    }));

    app.get('/test', () => {
      throw new UnauthorizedError('handler error');
    });

    const responseStream = new MockResponseStream();

    // Act
    await app.resolveStream(createTestEvent('/test', 'GET'), context, {
      responseStream,
    });

    // Assess
    const { prelude, body } = parseStreamOutput(responseStream.chunks);
    expect(prelude.statusCode).toBe(401);
    expect(JSON.parse(body)).toEqual({
      statusCode: 401,
      message: 'Custom: handler error',
    });
  });

  it.each([
    [
      'string body',
      () => ({ statusCode: 200, body: '{"message":"string body"}' }),
    ],
    [
      'node stream body',
      () => ({
        statusCode: 200,
        body: Readable.from(Buffer.from('{"message":"node stream body"}')),
      }),
    ],
    [
      'web stream body',
      () => ({
        statusCode: 200,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('{"message":"web stream body"}')
            );
            controller.close();
          },
        }),
      }),
    ],
  ])('handles ExtendedAPIGatewayProxyResult with %s', async (_, handlerFn) => {
    // Prepare
    const app = new Router();
    app.get('/test', handlerFn);
    const responseStream = new MockResponseStream();

    // Act
    await app.resolveStream(createTestEvent('/test', 'GET'), context, {
      responseStream,
    });

    // Assess
    const { prelude, body } = parseStreamOutput(responseStream.chunks);
    expect(prelude.statusCode).toBe(200);
    expect(JSON.parse(body).message).toMatch(/body$/);
  });

  it('handles Response with no body', async () => {
    // Prepare
    const app = new Router();
    app.get('/test', () => new Response(null, { status: 204 }));
    const responseStream = new MockResponseStream();

    // Act
    await app.resolveStream(createTestEvent('/test', 'GET'), context, {
      responseStream,
    });

    // Assess
    const { prelude, body } = parseStreamOutput(responseStream.chunks);
    expect(prelude.statusCode).toBe(204);
    expect(body).toBe('');
  });

  it('handles Response with undefined body', async () => {
    // Prepare
    const app = new Router();
    app.get('/test', () => new Response(undefined, { status: 200 }));
    const responseStream = new MockResponseStream();

    // Act
    await app.resolveStream(createTestEvent('/test', 'GET'), context, {
      responseStream,
    });

    // Assess
    const { prelude, body } = parseStreamOutput(responseStream.chunks);
    expect(prelude.statusCode).toBe(200);
    expect(body).toBe('');
  });

  it('handles pipeline errors during streaming', async () => {
    // Prepare
    const app = new Router();
    const errorStream = new ReadableStream({
      start(controller) {
        controller.error(new Error('Stream error'));
      },
    });

    app.get('/test', () => new Response(errorStream, { status: 200 }));
    const responseStream = new MockResponseStream();

    // Act & Assess
    await expect(
      app.resolveStream(createTestEvent('/test', 'GET'), context, {
        responseStream,
      })
    ).rejects.toThrow('Stream error');
  });

  it('extracts route parameters correctly', async () => {
    // Prepare
    const app = new Router();
    let capturedParams: Record<string, string> = {};

    app.get('/users/:userId/posts/:postId', ({ params }) => {
      capturedParams = params;
      return { userId: params.userId, postId: params.postId };
    });

    const responseStream = new MockResponseStream();

    // Act
    await app.resolveStream(
      createTestEvent('/users/123/posts/456', 'GET'),
      context,
      { responseStream }
    );

    // Assess
    const { prelude, body } = parseStreamOutput(responseStream.chunks);
    expect(prelude.statusCode).toBe(200);
    expect(capturedParams).toEqual({ userId: '123', postId: '456' });
    expect(JSON.parse(body)).toEqual({ userId: '123', postId: '456' });
  });

  it('uses default error handler for unregistered errors', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', 'true');
    const app = new Router();
    app.get('/test', () => {
      throw new Error('Unhandled error');
    });

    const responseStream = new MockResponseStream();

    // Act
    await app.resolveStream(createTestEvent('/test', 'GET'), context, {
      responseStream,
    });

    // Assess
    const { prelude, body } = parseStreamOutput(responseStream.chunks);
    expect(prelude.statusCode).toBe(500);
    const parsedBody = JSON.parse(body);
    expect(parsedBody.statusCode).toBe(500);
    expect(parsedBody.error).toBe('Internal Server Error');
    expect(parsedBody.message).toBe('Unhandled error');
    expect(parsedBody.stack).toBeDefined();
    expect(parsedBody.details).toEqual({ errorName: 'Error' });
  });

  it('throws InternalServerError for invalid events', async () => {
    // Prepare
    const app = new Router();
    const invalidEvent = { invalid: 'event' };
    const responseStream = new MockResponseStream();

    // Act & Assess
    await expect(
      app.resolveStream(invalidEvent, context, { responseStream })
    ).rejects.toThrow();
  });

  it('handles duplex stream body', async () => {
    // Prepare
    const app = new Router();
    const passThrough = new PassThrough();
    passThrough.write(Buffer.from('{"message":"duplex stream body"}'));
    passThrough.end();

    app.get('/test', () => ({
      statusCode: 200,
      body: Duplex.from(passThrough),
    }));

    const responseStream = new MockResponseStream();

    // Act
    await app.resolveStream(createTestEvent('/test', 'GET'), context, {
      responseStream,
    });

    // Assess
    const { prelude, body } = parseStreamOutput(responseStream.chunks);
    expect(prelude.statusCode).toBe(200);
    expect(JSON.parse(body)).toEqual({ message: 'duplex stream body' });
  });
});
