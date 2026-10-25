import context from '@aws-lambda-powertools/testing-utils/context';
import { describe, expect, it } from 'vitest';
import { Router } from '../../../../src/http/index.js';
import {
  createTestALBEvent,
  createTestEvent,
  createTestEventV2,
  ResponseStream,
} from '../helpers.js';

describe.each([
  { version: 'V1', createEvent: createTestEvent },
  { version: 'V2', createEvent: createTestEventV2 },
  { version: 'ALB', createEvent: createTestALBEvent },
])(
  'Class: Router - Response headers ($version)',
  ({ version, createEvent }) => {
    it('preserves every cookie from a returned Response', async () => {
      // Prepare
      const app = new Router();
      const cookies = ['a=1; Path=/', 'b=2; Path=/'];
      app.get('/login', () => {
        const headers = new Headers();
        for (const cookie of cookies) headers.append('set-cookie', cookie);
        return new Response('ok', { headers });
      });

      // Act
      const result = await app.resolve(createEvent('/login', 'GET'), context);

      // Assess
      expect(result).toMatchObject(
        version === 'V2'
          ? { cookies }
          : { multiValueHeaders: { 'set-cookie': cookies } }
      );
      expect(result.headers).not.toHaveProperty('set-cookie');
    });

    it('keeps middleware cookies alongside returned Response cookies', async () => {
      // Prepare
      const app = new Router();
      app.use(async ({ reqCtx, next }) => {
        reqCtx.res.headers.append('Set-Cookie', 'middleware=1; Path=/');
        reqCtx.res.headers.set('x-source', 'middleware');
        reqCtx.res.headers.set('x-context', 'preserved');
        await next();
      });
      app.get('/login', () => {
        const headers = new Headers({ 'x-source': 'handler' });
        headers.append('Set-Cookie', 'a=1; Path=/');
        headers.append('Set-Cookie', 'b=2; Path=/');
        return new Response('ok', { headers });
      });

      // Act
      const result = await app.resolve(createEvent('/login', 'GET'), context);

      // Assess
      const cookies = ['middleware=1; Path=/', 'a=1; Path=/', 'b=2; Path=/'];
      expect(result).toMatchObject(
        version === 'V2'
          ? { cookies }
          : { multiValueHeaders: { 'set-cookie': cookies } }
      );
      expect(result.headers).toMatchObject({
        'x-source': 'handler',
        'x-context': 'preserved',
      });
    });
  }
);

describe.each([
  { version: 'V1', createEvent: createTestEvent },
  { version: 'V2', createEvent: createTestEventV2 },
])('Class: Router - Streaming headers ($version)', ({ createEvent }) => {
  it.each([
    { source: 'proxy result', useResponse: false },
    { source: 'Response', useResponse: true },
  ])('streams every cookie from a $source', async ({ useResponse }) => {
    // Prepare
    const app = new Router();
    const cookies = [
      'a=1; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/',
      'b=2; HttpOnly; Path=/',
    ];
    app.get('/login', () => {
      if (!useResponse) return { statusCode: 200, body: 'ok', cookies };
      const headers = new Headers();
      for (const cookie of cookies) headers.append('set-cookie', cookie);
      return new Response('ok', { headers });
    });
    const responseStream = new ResponseStream();

    // Act
    await app.resolveStream(createEvent('/login', 'GET'), context, {
      responseStream,
    });

    // Assess
    const output = responseStream.getBuffer();
    const separatorIndex = output.indexOf(Buffer.alloc(8));
    const prelude = JSON.parse(output.subarray(0, separatorIndex).toString());
    expect(prelude.cookies).toEqual(cookies);
    expect(prelude.headers).not.toHaveProperty('set-cookie');
    expect(output.subarray(separatorIndex + 8).toString()).toBe('ok');
  });

  it('streams middleware cookies with the handler cookie', async () => {
    // Prepare
    const app = new Router();
    app.use(async ({ reqCtx, next }) => {
      await next();
      reqCtx.res.headers.append('set-cookie', 'middleware=1; Path=/');
    });
    app.get('/login', () => ({
      statusCode: 200,
      body: 'ok',
      cookies: ['handler=1; Path=/'],
    }));
    const responseStream = new ResponseStream();

    // Act
    await app.resolveStream(createEvent('/login', 'GET'), context, {
      responseStream,
    });

    // Assess
    const output = responseStream.getBuffer();
    const separatorIndex = output.indexOf(Buffer.alloc(8));
    const prelude = JSON.parse(output.subarray(0, separatorIndex).toString());
    expect(prelude.cookies).toEqual([
      'handler=1; Path=/',
      'middleware=1; Path=/',
    ]);
    expect(prelude.headers).not.toHaveProperty('set-cookie');
  });

  it('streams non-cookie headers without changing comma-containing values', async () => {
    // Prepare
    const app = new Router();
    const header = 'no-cache="set-cookie, vary"';
    app.get(
      '/test',
      () => new Response('ok', { headers: { 'cache-control': header } })
    );
    const responseStream = new ResponseStream();

    // Act
    await app.resolveStream(createEvent('/test', 'GET'), context, {
      responseStream,
    });

    // Assess
    const output = responseStream.getBuffer();
    const separatorIndex = output.indexOf(Buffer.alloc(8));
    const prelude = JSON.parse(output.subarray(0, separatorIndex).toString());
    expect(prelude.headers['cache-control']).toBe(header);
    expect(prelude).not.toHaveProperty('cookies');
  });
});
