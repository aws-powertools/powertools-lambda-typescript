import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import { validation } from '@aws-lambda-powertools/event-handler/experimental-rest/middleware';
import { z } from 'zod';

const app = new Router();

// Validate query parameters
const listUsersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  sort: z.enum(['name', 'email', 'createdAt']).optional(),
});

app.get('/users', {
  middleware: [validation({ req: { query: listUsersQuerySchema } })],
}, async (reqCtx) => {
  const url = new URL(reqCtx.req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  // query is typed with validated schema
  
  return {
    body: {
      users: [],
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
      },
    },
  };
});

// Validate headers
const apiKeyHeaderSchema = z.object({
  'x-api-key': z.string().min(32),
  'content-type': z.string().optional(),
});

app.post('/protected', {
  middleware: [validation({ req: { headers: apiKeyHeaderSchema } })],
}, async () => {
  return { statusCode: 200, body: 'Access granted' };
});

// Validate multiple components
app.post('/users/:id/posts', {
  middleware: [validation({
    req: {
      path: z.object({ id: z.string().uuid() }),
      body: z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1),
      }),
      headers: z.object({
        'content-type': z.literal('application/json'),
      }),
    },
  })],
}, async (reqCtx) => {
  const { id } = reqCtx.params;
  const body = reqCtx.req.body;
  
  return {
    statusCode: 201,
    body: {
      postId: '456',
      userId: id,
      title: body.title,
    },
  };
});

export const handler = app.resolve.bind(app);
