import context from '@aws-lambda-powertools/testing-utils/context';
import { describe, expect, it } from 'vitest';
import { Router } from '../../../../src/http/index.js';
import { createTestEvent, createTestEventV2 } from '../helpers.js';

describe.each([
  { version: 'V1', createEvent: createTestEvent },
  { version: 'V2', createEvent: createTestEventV2 },
])('Store ($version)', ({ createEvent }) => {
  describe('request-scoped store', () => {
    it('allows setting and getting values within a handler', async () => {
      // Prepare
      type AppEnv = { store: { request: { userId: string } } };
      const app = new Router<AppEnv>();
      app.get('/test', (reqCtx) => {
        reqCtx.set('userId', '123');
        return { userId: reqCtx.get('userId') };
      });

      // Act
      const result = await app.resolve(createEvent('/test', 'GET'), context);

      // Assess
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body ?? '')).toEqual({ userId: '123' });
    });

    it('isolates store data between requests', async () => {
      // Prepare
      type AppEnv = { store: { request: { key: string } } };
      const app = new Router<AppEnv>();

      app.get('/first', (reqCtx) => {
        reqCtx.set('key', 'first-value');
        return { ok: true };
      });

      app.get('/second', (reqCtx) => {
        return { value: reqCtx.get('key') ?? null };
      });

      // Act
      await app.resolve(createEvent('/first', 'GET'), context);
      const result = await app.resolve(createEvent('/second', 'GET'), context);

      // Assess
      expect(JSON.parse(result.body ?? '')).toEqual({ value: null });
    });

    it('supports has and delete operations', async () => {
      // Prepare
      type AppEnv = { store: { request: { key: string } } };
      const app = new Router<AppEnv>();
      app.get('/test', (reqCtx) => {
        reqCtx.set('key', 'value');
        const hasBefore = reqCtx.has('key');
        reqCtx.delete('key');
        const hasAfter = reqCtx.has('key');
        return { hasBefore, hasAfter };
      });

      // Act
      const result = await app.resolve(createEvent('/test', 'GET'), context);

      // Assess
      expect(JSON.parse(result.body ?? '')).toEqual({
        hasBefore: true,
        hasAfter: false,
      });
    });

    it('shares store data between middleware and handler', async () => {
      // Prepare
      type AppEnv = { store: { request: { fromMiddleware: string } } };
      const app = new Router<AppEnv>();
      app.use(async ({ reqCtx, next }) => {
        reqCtx.set('fromMiddleware', 'hello');
        await next();
      });

      app.get('/test', (reqCtx) => {
        return { value: reqCtx.get('fromMiddleware') };
      });

      // Act
      const result = await app.resolve(createEvent('/test', 'GET'), context);

      // Assess
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body ?? '')).toEqual({ value: 'hello' });
    });

    it('allows middleware to read store data set by handler after next()', async () => {
      // Prepare
      type AppEnv = { store: { request: { fromHandler: string } } };
      const app = new Router<AppEnv>();
      let valueAfterNext: unknown;

      app.use(async ({ reqCtx, next }) => {
        await next();
        valueAfterNext = reqCtx.get('fromHandler');
      });

      app.get('/test', (reqCtx) => {
        reqCtx.set('fromHandler', 'set-in-handler');
        return { ok: true };
      });

      // Act
      await app.resolve(createEvent('/test', 'GET'), context);

      // Assess
      expect(valueAfterNext).toBe('set-in-handler');
    });
  });

  describe('includeRouter store', () => {
    it('sub-router handlers can access the parent shared store', async () => {
      // Prepare
      type AppEnv = { store: { shared: { parentKey: string } } };
      const app = new Router<AppEnv>();
      app.shared.set('parentKey', 'parentValue');

      const subRouter = new Router<AppEnv>();
      subRouter.get('/sub', (reqCtx) => {
        return { value: reqCtx.shared.get('parentKey') };
      });

      app.includeRouter(subRouter);

      // Act
      const result = await app.resolve(createEvent('/sub', 'GET'), context);

      // Assess
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body ?? '')).toEqual({ value: 'parentValue' });
    });
  });

  describe('shared store', () => {
    it('persists data across requests', async () => {
      // Prepare
      type AppEnv = { store: { shared: { counter: number } } };
      const app = new Router<AppEnv>();
      app.shared.set('counter', 0);

      app.get('/increment', (reqCtx) => {
        const current = reqCtx.shared.get('counter') ?? 0;
        reqCtx.shared.set('counter', current + 1);
        return { counter: reqCtx.shared.get('counter') };
      });

      // Act
      await app.resolve(createEvent('/increment', 'GET'), context);
      const result = await app.resolve(
        createEvent('/increment', 'GET'),
        context
      );

      // Assess
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body ?? '')).toEqual({ counter: 2 });
    });

    it('shares data between different routes', async () => {
      // Prepare
      type AppEnv = { store: { shared: { token: string } } };
      const app = new Router<AppEnv>();

      app.get('/write', (reqCtx) => {
        reqCtx.shared.set('token', 'abc');
        return { ok: true };
      });

      app.get('/read', (reqCtx) => {
        return { token: reqCtx.shared.get('token') };
      });

      // Act
      await app.resolve(createEvent('/write', 'GET'), context);
      const result = await app.resolve(createEvent('/read', 'GET'), context);

      // Assess
      expect(JSON.parse(result.body ?? '')).toEqual({ token: 'abc' });
    });

    it('merges shared store entries from included router', async () => {
      // Prepare
      type ChildEnv = { store: { shared: { appName: string } } };
      const child = new Router<ChildEnv>();
      child.shared.set('appName', 'my-app');

      child.get('/info', (reqCtx) => {
        return { appName: reqCtx.shared.get('appName') };
      });

      const app = new Router().includeRouter(child, { prefix: '/child' });

      // Act
      const result = await app.resolve(
        createEvent('/child/info', 'GET'),
        context
      );

      // Assess
      expect(JSON.parse(result.body ?? '')).toEqual({ appName: 'my-app' });
    });

    it('is accessible in middleware', async () => {
      // Prepare
      type AppEnv = { store: { shared: { requestCount: number } } };
      const app = new Router<AppEnv>();
      app.shared.set('requestCount', 0);

      app.use(async ({ reqCtx, next }) => {
        const count = reqCtx.shared.get('requestCount') ?? 0;
        reqCtx.shared.set('requestCount', count + 1);
        await next();
      });

      app.get('/test', (reqCtx) => {
        return { requestCount: reqCtx.shared.get('requestCount') };
      });

      // Act
      await app.resolve(createEvent('/test', 'GET'), context);
      const result = await app.resolve(createEvent('/test', 'GET'), context);

      // Assess
      expect(JSON.parse(result.body ?? '')).toEqual({ requestCount: 2 });
    });
  });
});
