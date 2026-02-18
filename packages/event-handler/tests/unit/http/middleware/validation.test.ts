import { setTimeout } from 'node:timers/promises';
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

  it('validates request body successfully', async () => {
    // Prepare
    const requestBodySchema = z.object({ name: z.string() });

    app.post(
      '/users',
      (reqCtx) => {
        const { name } = reqCtx.valid.req.body;
        return { statusCode: 201, body: `Created ${name}` };
      },
      {
        validation: { req: { body: requestBodySchema } },
      }
    );

    const event = createTestEvent('/users', 'POST', {
      'content-type': 'application/json',
    });
    event.body = JSON.stringify({ name: 'John' });

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(201);
    expect(result.body).toBe('Created John');
  });

  it('returns 422 on request body validation failure', async () => {
    // Prepare
    const requestBodySchema = z.object({ name: z.string() });

    app.post('/users', () => ({ statusCode: 201, body: 'Created' }), {
      validation: { req: { body: requestBodySchema } },
    });

    const event = createTestEvent('/users', 'POST', {
      'content-type': 'application/json',
    });
    event.body = JSON.stringify({ invalid: 'data' });

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(422);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('RequestValidationError');
  });

  it('validates request body successfully when it is non-JSON', async () => {
    // Prepare
    const requestBodySchema = z.string();

    app.post(
      '/users',
      (reqCtx) => {
        const name = reqCtx.valid.req.body;
        return { statusCode: 201, body: `Created ${name}` };
      },
      {
        validation: { req: { body: requestBodySchema } },
      }
    );

    const event = createTestEvent('/users', 'POST', {
      'content-type': 'text/plain',
    });
    event.body = 'John';

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(201);
    expect(result.body).toBe('Created John');
  });

  it('returns 422 when the request is a malformed JSON', async () => {
    // Prepare
    const requestBodySchema = z.object({
      name: z.string(),
    });

    app.post(
      '/users',
      (reqCtx) => {
        const name = reqCtx.valid.req.body;
        return { statusCode: 201, body: `Created ${name}` };
      },
      {
        validation: { req: { body: requestBodySchema } },
      }
    );

    const event = createTestEvent('/users', 'POST', {
      'Content-Type': 'application/json',
    });
    event.body = "{'name': 'John'";

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(422);
    expect(result.body).toContain('RequestValidationError');
  });

  it('validates request headers successfully', async () => {
    // Prepare
    const headerSchema = z.object({ 'x-api-key': z.string() });

    app.get(
      '/protected',
      (reqCtx) => {
        const apiKey = reqCtx.valid.req.headers['x-api-key'];
        return { statusCode: 200, body: `Authenticated with ${apiKey}` };
      },
      {
        validation: { req: { headers: headerSchema } },
      }
    );

    const event = createTestEvent('/protected', 'GET', {
      'x-api-key': 'test-key',
    });

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('Authenticated with test-key');
  });

  it('returns 422 on request headers validation failure', async () => {
    // Prepare
    const headerSchema = z.object({ 'x-api-key': z.string() });

    app.get('/protected', () => ({ statusCode: 200, body: 'OK' }), {
      validation: { req: { headers: headerSchema } },
    });

    const event = createTestEvent('/protected', 'GET', {});

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(422);
  });

  it('validates path parameters successfully', async () => {
    // Prepare
    const pathSchema = z.object({ id: z.string() });

    app.get(
      '/users/:id',
      (reqCtx) => {
        const { id } = reqCtx.valid.req.path;
        return { id, validated: true };
      },
      {
        validation: { req: { path: pathSchema } },
      }
    );

    const event = createTestEvent('/users/123', 'GET', {});
    event.pathParameters = { id: '123' };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.id).toBe('123');
    expect(body.validated).toBe(true);
  });

  it('returns 422 on path parameters validation failure', async () => {
    // Prepare
    const pathSchema = z.object({ id: z.uuid() });

    app.get('/users/:id', () => ({ body: { id: '123' } }), {
      validation: { req: { path: pathSchema } },
    });

    const event = createTestEvent('/users/123', 'GET', {});
    event.pathParameters = { id: '123' };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(422);
  });

  it('validates query parameters successfully', async () => {
    // Prepare
    const querySchema = z.object({ page: z.string(), limit: z.string() });

    app.get(
      '/users',
      (reqCtx) => {
        const { page, limit } = reqCtx.valid.req.query;
        return {
          users: [],
          page: Number.parseInt(page, 10),
          limit: Number.parseInt(limit, 10),
        };
      },
      {
        validation: { req: { query: querySchema } },
      }
    );

    const event = createTestEvent('/users', 'GET', {});
    event.queryStringParameters = { page: '1', limit: '10' };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(10);
  });

  it('returns 422 on query parameters validation failure', async () => {
    // Prepare
    const querySchema = z.object({ page: z.string(), limit: z.string() });

    app.get('/users', () => ({ body: { users: [] } }), {
      validation: { req: { query: querySchema } },
    });

    const event = createTestEvent('/users', 'GET', {});
    event.queryStringParameters = { page: '1' };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(422);
  });

  it('validates and serializes a JSON object body in ExtendedAPIGatewayProxyResult', async () => {
    // Prepare
    const responseSchema = z.object({ id: z.string(), name: z.string() });

    app.get(
      '/users/:id',
      () => ({
        statusCode: 200,
        body: { id: '123', name: 'John' },
      }),
      {
        validation: { res: { body: responseSchema } },
      }
    );

    const event = createTestEvent('/users/123', 'GET', {});
    event.pathParameters = { id: '123' };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ id: '123', name: 'John' }));
  });

  it('validates response body successfully', async () => {
    // Prepare
    const responseSchema = z.object({ id: z.string(), name: z.string() });

    app.get(
      '/users/:id',
      () => {
        return { id: '123', name: 'John' };
      },
      {
        validation: { res: { body: responseSchema } },
      }
    );

    const event = createTestEvent('/users/123', 'GET', {});
    event.pathParameters = { id: '123' };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
  });

  it('returns 500 on response body validation failure', async () => {
    // Prepare
    const responseSchema = z.object({ id: z.string(), name: z.string() });

    // @ts-expect-error testing for validation failure
    app.get('/users/:id', () => ({ id: '123' }), {
      validation: { res: { body: responseSchema } },
    });

    const event = createTestEvent('/users/123', 'GET', {});
    event.pathParameters = { id: '123' };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(500);
  });

  it('validates response body successfully when it is non-JSON', async () => {
    // Prepare
    const responseBodySchema = z.string();

    app.post(
      '/users',
      () => {
        return 'Plain text response';
      },
      {
        validation: { res: { body: responseBodySchema } },
      }
    );

    const event = createTestEvent('/users', 'POST');

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('"Plain text response"');
  });

  it('returns 500 when the response is an invalid JSON', async () => {
    // Prepare
    const responseSchema = z.object({ name: z.string() });
    app.get(
      '/invalid',
      // @ts-expect-error testing for validation failure
      () => {
        return new Response('{"name": "John"', {
          headers: {
            'content-type': 'application/json',
          },
        });
      },
      {
        validation: { res: { body: responseSchema } },
      }
    );

    const event = createTestEvent('/invalid', 'GET');

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(500);
  });

  it('validates response headers successfully', async () => {
    // Prepare
    const responseHeaderSchema = z.object({ 'x-custom-header': z.string() });

    app.get(
      '/test',
      () => {
        return new Response('OK', {
          headers: { 'x-custom-header': 'test-value' },
        });
      },
      {
        validation: { res: { headers: responseHeaderSchema } },
      }
    );

    const event = createTestEvent('/test', 'GET', {});

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
  });

  it('returns 500 on response headers validation failure', async () => {
    // Prepare
    const responseHeaderSchema = z.object({ 'x-required': z.string() });

    app.get(
      '/test',
      () => {
        return new Response('OK', {
          headers: { 'x-other': 'value' },
        });
      },
      {
        validation: { res: { headers: responseHeaderSchema } },
      }
    );

    const event = createTestEvent('/test', 'GET', {});

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(500);
  });

  it('validates both request and response', async () => {
    // Prepare
    const requestSchema = z.object({ name: z.string(), email: z.string() });
    const responseSchema = z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    });

    app.post(
      '/users',
      (reqCtx) => {
        const { name, email } = reqCtx.valid.req.body;
        return { id: '123', name, email };
      },
      {
        validation: {
          req: { body: requestSchema },
          res: { body: responseSchema },
        },
      }
    );

    const event = createTestEvent('/users', 'POST', {
      'content-type': 'application/json',
    });
    event.body = JSON.stringify({ name: 'John', email: 'john@example.com' });

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.name).toBe('John');
    expect(body.email).toBe('john@example.com');
  });

  it('applies validation only to configured routes', async () => {
    // Prepare
    const bodySchema = z.object({ name: z.string() });

    app.post('/validated', () => ({ statusCode: 201 }), {
      validation: { req: { body: bodySchema } },
    });

    app.post('/unvalidated', () => ({ statusCode: 201 }));

    const validatedEvent = createTestEvent('/validated', 'POST', {
      'content-type': 'application/json',
    });
    validatedEvent.body = JSON.stringify({ data: 'test' });

    const unvalidatedEvent = createTestEvent('/unvalidated', 'POST', {
      'content-type': 'application/json',
    });
    unvalidatedEvent.body = JSON.stringify({ data: 'test' });

    // Act
    const validatedResult = await app.resolve(validatedEvent, context);
    const unvalidatedResult = await app.resolve(unvalidatedEvent, context);

    // Assess
    expect(validatedResult.statusCode).toBe(422);
    expect(unvalidatedResult.statusCode).toBe(200);
  });

  it('validates with async schema refinement', async () => {
    // Prepare
    const requestBodySchema = z.object({ email: z.string().email() }).refine(
      async (data) => {
        // Simulate async validation (e.g., checking if email exists)
        await setTimeout(10);
        return !data.email.includes('blocked');
      },
      { message: 'Email is blocked' }
    );

    app.post(
      '/register',
      (reqCtx) => {
        const { email } = reqCtx.valid.req.body;
        return { statusCode: 201, body: `Registered ${email}` };
      },
      {
        validation: { req: { body: requestBodySchema } },
      }
    );

    const validEvent = createTestEvent('/register', 'POST', {
      'content-type': 'application/json',
    });
    validEvent.body = JSON.stringify({ email: 'user@example.com' });

    const blockedEvent = createTestEvent('/register', 'POST', {
      'content-type': 'application/json',
    });
    blockedEvent.body = JSON.stringify({ email: 'blocked@example.com' });

    // Act
    const validResult = await app.resolve(validEvent, context);
    const blockedResult = await app.resolve(blockedEvent, context);

    // Assess
    expect(validResult.statusCode).toBe(201);
    expect(validResult.body).toBe('Registered user@example.com');
    expect(blockedResult.statusCode).toBe(422);
  });

  it('includes correct path in validation errors', async () => {
    // Prepare
    const bodySchema = z.object({ name: z.string() });
    const querySchema = z.object({ page: z.string() });
    const pathSchema = z.object({ id: z.string().uuid() });

    app.post('/users/:id', () => ({ statusCode: 200 }), {
      validation: {
        req: { body: bodySchema, query: querySchema, path: pathSchema },
      },
    });

    const event = createTestEvent('/users/invalid-id', 'POST', {
      'content-type': 'application/json',
    });
    event.body = JSON.stringify({ invalid: 'field' });
    event.queryStringParameters = { wrong: 'param' };
    event.pathParameters = { id: 'invalid-id' };

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(422);
    const body = JSON.parse(result.body);
    expect(body.details?.issues).toBeDefined();

    const paths = body.details.issues.map(
      (issue: { path: unknown[] }) => issue.path
    );
    expect(paths.some((p: unknown[]) => p[0] === 'body')).toBe(true);
    expect(paths.some((p: unknown[]) => p[0] === 'query')).toBe(true);
    expect(paths.some((p: unknown[]) => p[0] === 'path')).toBe(true);
  });

  it('returns 422 when request body is null with object schema', async () => {
    // Prepare
    const requestBodySchema = z.object({ name: z.string() });

    app.post('/users', () => ({ statusCode: 201 }), {
      validation: { req: { body: requestBodySchema } },
    });

    const event = createTestEvent('/users', 'POST', {
      'content-type': 'application/json',
    });
    event.body = 'null';

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(422);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('RequestValidationError');
  });

  it('handles validation error with missing path in issue', async () => {
    // Prepare
    const customSchema = {
      '~standard': {
        version: 1,
        vendor: 'custom',
        validate: async () => ({
          issues: [{ message: 'Error without path' }],
        }),
      },
    } as const;

    app.post('/test', () => ({ statusCode: 200 }), {
      validation: { req: { body: customSchema } },
    });

    const event = createTestEvent('/test', 'POST', {
      'content-type': 'application/json',
    });
    event.body = '{}';

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(422);
  });

  it('enforces return type annotation alongside request validation', async () => {
    // Prepare
    const bodySchema = z.object({ name: z.string() });

    app.post(
      '/users',
      (reqCtx): { id: number; name: string } => {
        const { name } = reqCtx.valid.req.body;
        return { id: 1, name };
      },
      { validation: { req: { body: bodySchema } } }
    );

    const event = createTestEvent('/users', 'POST', {
      'content-type': 'application/json',
    });
    event.body = JSON.stringify({ name: 'Alice' });

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ id: 1, name: 'Alice' });
  });

  it('rejects a handler with an incorrect return type annotation alongside request validation', () => {
    const bodySchema = z.object({ name: z.string() });

    app.post(
      '/users',
      (reqCtx): { id: number; name: string } => {
        const { name } = reqCtx.valid.req.body;
        // @ts-expect-error — missing id property
        return { name };
      },
      { validation: { req: { body: bodySchema } } }
    );
  });
});
