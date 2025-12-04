import context from '@aws-lambda-powertools/testing-utils/context';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { Router } from '../../../../src/http/index.js';
import { createTestEvent } from '../helpers.js';

describe('Router Validation Integration', () => {
  let app: Router;

  beforeEach(() => {
    app = new Router();
  });

  describe('Request Body Validation', () => {
    it('validates request body successfully', async () => {
      const bodySchema = z.object({ name: z.string() });

      app.post('/users', async () => ({ statusCode: 201, body: 'Created' }), {
        validation: { req: { body: bodySchema } },
      });

      const event = createTestEvent('/users', 'POST', {
        'content-type': 'application/json',
      });
      event.body = JSON.stringify({ name: 'John' });

      const result = await app.resolve(event, context);
      expect(result.statusCode).toBe(201);
    });

    it('returns 422 on request body validation failure', async () => {
      const bodySchema = z.object({ name: z.string() });

      app.post('/users', async () => ({ statusCode: 201, body: 'Created' }), {
        validation: { req: { body: bodySchema } },
      });

      const event = createTestEvent('/users', 'POST', {
        'content-type': 'application/json',
      });
      event.body = JSON.stringify({ invalid: 'data' });

      const result = await app.resolve(event, context);
      expect(result.statusCode).toBe(422);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('RequestValidationError');
    });
  });

  describe('Request Headers Validation', () => {
    it('validates request headers successfully', async () => {
      const headerSchema = z.object({ 'x-api-key': z.string() });

      app.get('/protected', async () => ({ statusCode: 200, body: 'OK' }), {
        validation: { req: { headers: headerSchema } },
      });

      const event = createTestEvent('/protected', 'GET', {
        'x-api-key': 'test-key',
      });

      const result = await app.resolve(event, context);
      expect(result.statusCode).toBe(200);
    });

    it('returns 422 on request headers validation failure', async () => {
      const headerSchema = z.object({ 'x-api-key': z.string() });

      app.get('/protected', async () => ({ statusCode: 200, body: 'OK' }), {
        validation: { req: { headers: headerSchema } },
      });

      const event = createTestEvent('/protected', 'GET', {});

      const result = await app.resolve(event, context);
      expect(result.statusCode).toBe(422);
    });
  });

  describe('Request Path Parameters Validation', () => {
    it('validates path parameters successfully', async () => {
      const pathSchema = z.object({ id: z.string() });

      app.get(
        '/users/:id',
        async (reqCtx) => ({ body: { id: reqCtx.params.id } }),
        {
          validation: { req: { path: pathSchema } },
        }
      );

      const event = createTestEvent('/users/123', 'GET', {});
      event.pathParameters = { id: '123' };

      const result = await app.resolve(event, context);
      expect(result.statusCode).toBe(200);
    });

    it('returns 422 on path parameters validation failure', async () => {
      const pathSchema = z.object({ id: z.string().uuid() });

      app.get('/users/:id', async () => ({ body: { id: '123' } }), {
        validation: { req: { path: pathSchema } },
      });

      const event = createTestEvent('/users/123', 'GET', {});
      event.pathParameters = { id: '123' };

      const result = await app.resolve(event, context);
      expect(result.statusCode).toBe(422);
    });
  });

  describe('Request Query Parameters Validation', () => {
    it('validates query parameters successfully', async () => {
      const querySchema = z.object({ page: z.string(), limit: z.string() });

      app.get('/users', async () => ({ body: { users: [] } }), {
        validation: { req: { query: querySchema } },
      });

      const event = createTestEvent('/users', 'GET', {});
      event.queryStringParameters = { page: '1', limit: '10' };

      const result = await app.resolve(event, context);
      expect(result.statusCode).toBe(200);
    });

    it('returns 422 on query parameters validation failure', async () => {
      const querySchema = z.object({ page: z.string(), limit: z.string() });

      app.get('/users', async () => ({ body: { users: [] } }), {
        validation: { req: { query: querySchema } },
      });

      const event = createTestEvent('/users', 'GET', {});
      event.queryStringParameters = { page: '1' };

      const result = await app.resolve(event, context);
      expect(result.statusCode).toBe(422);
    });
  });

  describe('Response Body Validation', () => {
    it('validates response body successfully', async () => {
      const responseSchema = z.object({ id: z.string(), name: z.string() });

      app.get('/users/:id', async () => ({ id: '123', name: 'John' }), {
        validation: { res: { body: responseSchema } },
      });

      const event = createTestEvent('/users/123', 'GET', {});
      event.pathParameters = { id: '123' };

      const result = await app.resolve(event, context);
      expect(result.statusCode).toBe(200);
    });

    it('returns 500 on response body validation failure', async () => {
      const responseSchema = z.object({ id: z.string(), name: z.string() });

      app.get('/users/:id', async () => ({ id: '123' }), {
        validation: { res: { body: responseSchema } },
      });

      const event = createTestEvent('/users/123', 'GET', {});
      event.pathParameters = { id: '123' };

      const result = await app.resolve(event, context);
      expect(result.statusCode).toBe(500);
    });
  });

  describe('Combined Request and Response Validation', () => {
    it('validates both request and response', async () => {
      const requestSchema = z.object({ name: z.string() });
      const responseSchema = z.object({ id: z.string(), name: z.string() });

      app.post('/users', async () => ({ id: '123', name: 'John' }), {
        validation: {
          req: { body: requestSchema },
          res: { body: responseSchema },
        },
      });

      const event = createTestEvent('/users', 'POST', {
        'content-type': 'application/json',
      });
      event.body = JSON.stringify({ name: 'John' });

      const result = await app.resolve(event, context);
      expect(result.statusCode).toBe(200);
    });
  });

  describe('Multiple Routes with Different Validation', () => {
    it('applies validation only to configured routes', async () => {
      const bodySchema = z.object({ name: z.string() });

      app.post('/validated', async () => ({ statusCode: 201 }), {
        validation: { req: { body: bodySchema } },
      });

      app.post('/unvalidated', async () => ({ statusCode: 201 }));

      const validatedEvent = createTestEvent('/validated', 'POST', {
        'content-type': 'application/json',
      });
      validatedEvent.body = JSON.stringify({ data: 'test' });

      const unvalidatedEvent = createTestEvent('/unvalidated', 'POST', {
        'content-type': 'application/json',
      });
      unvalidatedEvent.body = JSON.stringify({ data: 'test' });

      const validatedResult = await app.resolve(validatedEvent, context);
      expect(validatedResult.statusCode).toBe(422);

      const unvalidatedResult = await app.resolve(unvalidatedEvent, context);
      expect(unvalidatedResult.statusCode).toBe(200);
    });
  });
});
