import context from '@aws-lambda-powertools/testing-utils/context';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { Router } from '../../../../src/http/index.js';
import {
  createTestALBEvent,
  createTestEvent,
  createTestEventV2,
} from '../helpers.js';

describe.each([
  { responseType: 'ApiGatewayV1', createEvent: createTestEvent },
  { responseType: 'ApiGatewayV2', createEvent: createTestEventV2 },
  { responseType: 'ALB', createEvent: createTestALBEvent },
])('Request normalization ($responseType)', ({ responseType, createEvent }) => {
  it('preserves binary bytes in a base64 request body', async () => {
    // Prepare
    const app = new Router();
    const bytes = Buffer.from([0x00, 0x7f, 0x80, 0xff, 0xc3, 0x28]);
    const event = createEvent('/upload', 'POST', {
      'content-type': 'application/octet-stream',
    });
    event.body = bytes.toString('base64');
    event.isBase64Encoded = true;
    app.post('/upload', async ({ req }) => ({
      bytes: Array.from(new Uint8Array(await req.arrayBuffer())),
      contentType: req.headers.get('content-type'),
    }));

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body ?? '')).toEqual({
      bytes: Array.from(bytes),
      contentType: 'application/octet-stream',
    });
  });

  it('preserves binary file bytes in a multipart request body', async () => {
    // Prepare
    const app = new Router();
    const bytes = Buffer.from([0x00, 0x80, 0xff, 0xfe]);
    const boundary = 'powertools-upload';
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="upload"; filename="file.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`
      ),
      bytes,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const event = createEvent('/upload', 'POST', {
      'content-type': `multipart/form-data; boundary=${boundary}`,
    });
    event.body = body.toString('base64');
    event.isBase64Encoded = true;
    app.post('/upload', async ({ req }) => {
      const form = await req.formData();
      const file = form.get('upload');
      return file instanceof File
        ? Array.from(new Uint8Array(await file.arrayBuffer()))
        : null;
    });

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body ?? '')).toEqual(Array.from(bytes));
  });

  it.each([
    { isBase64Encoded: false, contentType: 'text/plain;charset=UTF-8' },
    { isBase64Encoded: true, contentType: null },
  ])(
    'uses the expected default content type for base64=$isBase64Encoded',
    async ({ isBase64Encoded, contentType }) => {
      // Prepare
      const app = new Router();
      const text = 'Hello, 世界';
      const event = createEvent('/body', 'POST');
      event.body = isBase64Encoded
        ? Buffer.from(text).toString('base64')
        : text;
      event.isBase64Encoded = isBase64Encoded;
      app.post('/body', async ({ req }) => ({
        text: await req.text(),
        contentType: req.headers.get('content-type'),
      }));

      // Act
      const result = await app.resolve(event, context);

      // Assess
      expect(JSON.parse(result.body ?? '')).toEqual({ text, contentType });
    }
  );

  it.each(['get', 'head'])('ignores a base64 body for %s', async (method) => {
    // Prepare
    const app = new Router();
    const handler = ({ req }: { req: Request }) => ({
      hasBody: req.body !== null,
    });
    app.get('/body', handler);
    app.head('/body', handler);
    const event = createEvent('/body', method);
    event.body = Buffer.from([0xff, 0x00]).toString('base64');
    event.isBase64Encoded = true;

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body ?? '')).toEqual({ hasBody: false });
  });

  it('routes a lowercase patch method with the original event context', async () => {
    // Prepare
    const app = new Router();
    const event = createEvent('/test', 'patch');
    app.patch('/test', (reqCtx) => ({
      method: reqCtx.req.method,
      responseType: reqCtx.responseType,
      sameEvent: reqCtx.event === event,
      sameContext: reqCtx.context === context,
    }));

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body ?? '')).toEqual({
      method: 'PATCH',
      responseType,
      sameEvent: true,
      sameContext: true,
    });
  });

  it('validates a base64 JSON request and its response', async () => {
    // Prepare
    const app = new Router();
    const event = createEvent('/users', 'POST', {
      'content-type': 'application/json',
    });
    event.body = Buffer.from(JSON.stringify({ name: '世界' })).toString(
      'base64'
    );
    event.isBase64Encoded = true;
    app.post(
      '/users',
      async (reqCtx) => ({
        name: reqCtx.valid.req.body.name,
        original: await reqCtx.req.text(),
      }),
      {
        validation: {
          req: { body: z.object({ name: z.string() }) },
          res: {
            body: z.object({
              name: z.string(),
              original: z.string(),
            }),
          },
        },
      }
    );

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body ?? '')).toEqual({
      name: '世界',
      original: JSON.stringify({ name: '世界' }),
    });
  });

  it.each<{ headers: Record<string, string>; failure: string }>([
    { headers: { Host: 'invalid host' }, failure: 'URL' },
    { headers: { 'invalid header': 'value' }, failure: 'header' },
  ])(
    'rejects $failure construction errors before middleware',
    async ({ headers }) => {
      // Prepare
      const app = new Router();
      const middleware = vi.fn();
      const errorHandler = vi.fn(async () => ({ handled: true }));
      app.use(middleware);
      app.errorHandler(TypeError, errorHandler);
      const event = createEvent('/test', 'GET', headers);

      // Act & Assess
      await expect(app.resolve(event, context)).rejects.toThrow(TypeError);
      expect(middleware).not.toHaveBeenCalled();
      expect(errorHandler).not.toHaveBeenCalled();
    }
  );

  it('returns 405 before constructing headers or the URL', async () => {
    // Prepare
    const app = new Router();
    const middleware = vi.fn();
    const errorHandler = vi.fn(async () => ({ handled: true }));
    app.use(middleware);
    app.errorHandler(Error, errorHandler);
    const event = createEvent('/test', 'TRACE', {
      Host: 'invalid host',
      'invalid header': 'value',
    });

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(405);
    expect(result.body).toBe('');
    expect(middleware).not.toHaveBeenCalled();
    expect(errorHandler).not.toHaveBeenCalled();
  });
});

describe.each([
  { version: 'V1', createEvent: createTestEvent },
  { version: 'ALB', createEvent: createTestALBEvent },
])('Structured request URLs ($version)', ({ createEvent }) => {
  it('preserves repeated query values and their encoding', async () => {
    // Prepare
    const app = new Router();
    const event = createEvent('/test', 'GET', { Host: 'api.example.com' });
    event.queryStringParameters = {
      tag: 'second',
      space: 'a b',
      encoded: 'a%20b',
    };
    event.multiValueQueryStringParameters = {
      tag: ['first', 'second', 'first'],
    };
    app.get('/test', ({ req }) => ({ url: req.url }));

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(JSON.parse(result.body ?? '')).toEqual({
      url: 'https://api.example.com/test?space=a+b&encoded=a%2520b&tag=first&tag=second&tag=first',
    });
  });

  it('preserves the existing authority resolution for a path starting with two slashes', async () => {
    // Prepare
    const app = new Router();
    const event = createEvent('//other.example/test', 'GET', {
      Host: 'api.example.com',
    });
    app.get('/test', ({ req }) => ({ url: req.url }));

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(JSON.parse(result.body ?? '')).toEqual({
      url: 'https://other.example/test',
    });
  });
});

describe('Raw request URLs and cookies (V2)', () => {
  it('preserves raw query spelling and repeated values', async () => {
    // Prepare
    const app = new Router();
    const event = createTestEventV2('/test', 'GET');
    event.rawQueryString = 'q=a%20b&literal=%2f&tag=one&tag=two&flag&tilde=~';
    event.queryStringParameters = { tag: 'one,two' };
    app.get('/test', ({ req }) => ({ url: req.url }));

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(JSON.parse(result.body ?? '')).toEqual({
      url: `https://api.example.com/test?${event.rawQueryString}`,
    });
  });

  it('keeps a path starting with two slashes on the original host', async () => {
    // Prepare
    const app = new Router();
    const event = createTestEventV2('//other.example/test', 'GET');
    app.get('//other.example/test', ({ req }) => ({ url: req.url }));

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(JSON.parse(result.body ?? '')).toEqual({
      url: 'https://api.example.com//other.example/test',
    });
  });

  it.each([
    { cookies: [], expected: '' },
    {
      cookies: ['session=abc', 'theme=dark'],
      expected: 'session=abc; theme=dark',
    },
  ])(
    'uses the cookies array over the Cookie header: $expected',
    async ({ cookies, expected }) => {
      // Prepare
      const app = new Router();
      const event = createTestEventV2('/test', 'GET', {
        Cookie: 'previous=value',
      });
      event.cookies = cookies;
      app.get('/test', ({ req }) => ({ cookie: req.headers.get('cookie') }));

      // Act
      const result = await app.resolve(event, context);

      // Assess
      expect(JSON.parse(result.body ?? '')).toEqual({ cookie: expected });
    }
  );
});
