import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import { z } from 'zod';

const app = new Router();

// Validate query parameters
const listUsersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  sort: z.enum(['name', 'email', 'createdAt']).optional(),
});

app.get(
  '/users',
  async () => {
    return {
      users: [],
      pagination: {
        page: 1,
        limit: 10,
      },
    };
  },
  {
    validation: { req: { query: listUsersQuerySchema } },
  }
);

// Validate headers
const apiKeyHeaderSchema = z.object({
  'x-api-key': z.string().min(32),
  'content-type': z.string().optional(),
});

app.post(
  '/protected',
  async () => {
    return { message: 'Access granted' };
  },
  {
    validation: { req: { headers: apiKeyHeaderSchema } },
  }
);

// Validate multiple components
app.post(
  '/users/:id/posts',
  async (reqCtx) => {
    const { id } = reqCtx.params;

    return {
      postId: '456',
      userId: id,
      title: 'New Post',
    };
  },
  {
    validation: {
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
    },
  }
);

export const handler = app.resolve.bind(app);
