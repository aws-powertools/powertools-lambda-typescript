import context from '@aws-lambda-powertools/testing-utils/context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { HttpStatusCodes, Router } from '../../../../src/http/index.js';
import { createTestEvent } from '../helpers.js';

describe('Validation Middleware', () => {
  let app: Router;

  beforeEach(() => {
    app = new Router();
  });

  it('validates request body successfully', async () => {
    // Prepare
    const bodySchema = z.object({ name: z.string() });
    const validateSpy = vi.spyOn(bodySchema['~standard'], 'validate');
    app.post('/users', async () => ({}), {
      validation: { req: { body: bodySchema } },
    });
    const event = {
      ...createTestEvent('/users', 'POST', {
        'content-type': 'application/json',
      }),
      body: JSON.stringify({ name: 'John' }),
    };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.OK);
    expect(validateSpy).toHaveBeenCalledExactlyOnceWith({ name: 'John' });
  });

  it('returns 422 on request body validation failure', async () => {
    // Prepare
    const bodySchema = z.object({ name: z.string() });
    const validateSpy = vi.spyOn(bodySchema['~standard'], 'validate');
    app.post('/users', async () => ({}), {
      validation: { req: { body: bodySchema } },
    });
    const event = {
      ...createTestEvent('/users', 'POST', {
        'content-type': 'application/json',
      }),
      body: JSON.stringify({ invalid: 'data' }),
    };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY);
    expect(validateSpy).toHaveBeenCalledExactlyOnceWith({ invalid: 'data' });
    const body = JSON.parse(result.body);
    expect(body.error).toBe('RequestValidationError');
  });

  it('validates request headers successfully', async () => {
    // Prepare
    const headerSchema = z.object({ 'x-api-key': z.string() });
    const validateSpy = vi.spyOn(headerSchema['~standard'], 'validate');
    app.get('/protected', async () => ({}), {
      validation: { req: { headers: headerSchema } },
    });
    const event = createTestEvent('/protected', 'GET', {
      'x-api-key': 'test-key',
    });

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.OK);
    expect(validateSpy).toHaveBeenCalledOnce();
  });

  it('returns 422 on request headers validation failure', async () => {
    // Prepare
    const headerSchema = z.object({ 'x-api-key': z.string() });
    const validateSpy = vi.spyOn(headerSchema['~standard'], 'validate');
    app.get('/protected', async () => ({}), {
      validation: { req: { headers: headerSchema } },
    });
    const event = createTestEvent('/protected', 'GET', {});

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY);
    expect(validateSpy).toHaveBeenCalledOnce();
  });

  it('validates path parameters successfully', async () => {
    // Prepare
    const pathSchema = z.object({ id: z.string() });
    const validateSpy = vi.spyOn(pathSchema['~standard'], 'validate');
    app.get('/users/:id', async (reqCtx) => ({ id: reqCtx.params.id }), {
      validation: { req: { path: pathSchema } },
    });
    const event = {
      ...createTestEvent('/users/123', 'GET'),
      pathParameters: { id: '123' },
    };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.OK);
    expect(validateSpy).toHaveBeenCalledExactlyOnceWith({ id: '123' });
  });

  it('returns 422 on path parameters validation failure', async () => {
    // Prepare
    const pathSchema = z.object({ id: z.string().uuid() });
    const validateSpy = vi.spyOn(pathSchema['~standard'], 'validate');
    app.get('/users/:id', async () => ({}), {
      validation: { req: { path: pathSchema } },
    });
    const event = {
      ...createTestEvent('/users/123', 'GET'),
      pathParameters: { id: '123' },
    };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY);
    expect(validateSpy).toHaveBeenCalledExactlyOnceWith({ id: '123' });
  });

  it('validates query parameters successfully', async () => {
    // Prepare
    const querySchema = z.object({ page: z.string(), limit: z.string() });
    const validateSpy = vi.spyOn(querySchema['~standard'], 'validate');
    app.get('/users', async () => ({ users: [] }), {
      validation: { req: { query: querySchema } },
    });
    const event = {
      ...createTestEvent('/users', 'GET'),
      queryStringParameters: { page: '1', limit: '10' },
    };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.OK);
    expect(validateSpy).toHaveBeenCalledExactlyOnceWith({
      page: '1',
      limit: '10',
    });
  });

  it('returns 422 on query parameters validation failure', async () => {
    // Prepare
    const querySchema = z.object({
      page: z.string(),
      limit: z.string(),
    });
    const validateSpy = vi.spyOn(querySchema['~standard'], 'validate');
    app.get('/users', async () => ({ users: [] }), {
      validation: { req: { query: querySchema } },
    });
    const event = {
      ...createTestEvent('/users', 'GET'),
      queryStringParameters: { page: '1' },
    };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY);
    expect(validateSpy).toHaveBeenCalledExactlyOnceWith({ page: '1' });
  });

  it('skips validation when no config provided', async () => {
    // Prepare
    app.get('/test', async () => ({ body: 'test' }));
    const event = createTestEvent('/test', 'GET');

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.OK);
  });

  it('applies validation only to configured routes', async () => {
    // Prepare
    const bodySchema = z.object({ name: z.string() });
    const validateSpy = vi.spyOn(bodySchema['~standard'], 'validate');
    app.post('/validated', async () => ({}), {
      validation: { req: { body: bodySchema } },
    });
    app.post('/unvalidated', async () => ({}));
    const validatedEvent = {
      ...createTestEvent('/validated', 'POST', {
        'content-type': 'application/json',
      }),
      body: JSON.stringify({ invalid: 'data' }),
    };
    const unvalidatedEvent = {
      ...createTestEvent('/unvalidated', 'POST', {
        'content-type': 'application/json',
      }),
      body: JSON.stringify({ data: 'test' }),
    };

    // Act
    const validatedResult = await app.resolve(validatedEvent, context);
    const unvalidatedResult = await app.resolve(unvalidatedEvent, context);

    // Assess
    expect(validatedResult.statusCode).toBe(
      HttpStatusCodes.UNPROCESSABLE_ENTITY
    );
    expect(unvalidatedResult.statusCode).toBe(HttpStatusCodes.OK);
    expect(validateSpy).toHaveBeenCalledExactlyOnceWith({ invalid: 'data' });
  });

  it('handles invalid JSON in request body', async () => {
    // Prepare
    const bodySchema = z.object({ name: z.string() });
    const validateSpy = vi.spyOn(bodySchema['~standard'], 'validate');
    app.post('/users', async () => ({}), {
      validation: { req: { body: bodySchema } },
    });
    const event = {
      ...createTestEvent('/users', 'POST', {
        'content-type': 'application/json',
      }),
      body: 'invalid json{',
    };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY);
    expect(validateSpy).toHaveBeenCalledExactlyOnceWith('invalid json{');
  });

  it('validates response body successfully', async () => {
    // Prepare
    const responseSchema = z.object({ id: z.string(), name: z.string() });
    const validateSpy = vi.spyOn(responseSchema['~standard'], 'validate');
    app.get('/users/:id', async () => ({ id: '123', name: 'John' }), {
      validation: { res: { body: responseSchema } },
    });
    const event = {
      ...createTestEvent('/users/123', 'GET'),
      pathParameters: { id: '123' },
    };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.OK);
    expect(validateSpy).toHaveBeenCalledExactlyOnceWith({
      id: '123',
      name: 'John',
    });
  });

  it('validates response headers successfully', async () => {
    // Prepare
    const responseSchema = z.object({ 'content-type': z.string() });
    const validateSpy = vi.spyOn(responseSchema['~standard'], 'validate');
    app.get('/test', async () => ({ body: 'test' }), {
      validation: { res: { headers: responseSchema } },
    });
    const event = createTestEvent('/test', 'GET');

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.OK);
    expect(validateSpy).toHaveBeenCalledOnce();
  });

  it('validates non-JSON response body successfully', async () => {
    // Prepare
    const responseSchema = z.string();
    const validateSpy = vi.spyOn(responseSchema['~standard'], 'validate');
    app.get(
      '/text',
      () => {
        return new Response('plain text', {
          headers: { 'content-type': 'text/plain' },
        });
      },
      {
        validation: { res: { body: responseSchema } },
      }
    );
    const event = createTestEvent('/text', 'GET');

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.OK);
    expect(validateSpy).toHaveBeenCalledExactlyOnceWith('plain text');
  });

  it('returns 500 on response body validation failure', async () => {
    // Prepare
    const responseSchema = z.object({ id: z.string(), name: z.string() });
    const validateSpy = vi.spyOn(responseSchema['~standard'], 'validate');
    app.get('/users/:id', async () => ({ id: '123' }), {
      validation: { res: { body: responseSchema } },
    });
    const event = {
      ...createTestEvent('/users/123', 'GET'),
      pathParameters: { id: '123' },
    };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(validateSpy).toHaveBeenCalledExactlyOnceWith({ id: '123' });
    const body = JSON.parse(result.body);
    expect(body.error).toBe('ResponseValidationError');
  });

  it('validates both request and response', async () => {
    // Prepare
    const requestSchema = z.object({ name: z.string() });
    const responseSchema = z.object({ id: z.string(), name: z.string() });
    const requestValidateSpy = vi.spyOn(requestSchema['~standard'], 'validate');
    const responseValidateSpy = vi.spyOn(
      responseSchema['~standard'],
      'validate'
    );
    app.post('/users', async () => ({ id: '123', name: 'John' }), {
      validation: {
        req: { body: requestSchema },
        res: { body: responseSchema },
      },
    });
    const event = {
      ...createTestEvent('/users', 'POST', {
        'content-type': 'application/json',
      }),
      body: JSON.stringify({ name: 'John' }),
    };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.OK);
    expect(requestValidateSpy).toHaveBeenCalledExactlyOnceWith({
      name: 'John',
    });
    expect(responseValidateSpy).toHaveBeenCalledExactlyOnceWith({
      id: '123',
      name: 'John',
    });
  });

  it('validates non-JSON request body (text/plain)', async () => {
    // Prepare
    const textSchema = z.string();
    app.post('/text', async () => ({ statusCode: 200, body: 'OK' }), {
      validation: { req: { body: textSchema } },
    });
    const event = {
      ...createTestEvent('/text', 'POST', {
        'content-type': 'text/plain',
      }),
      body: 'plain text content',
    };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(HttpStatusCodes.OK);
  });
});
