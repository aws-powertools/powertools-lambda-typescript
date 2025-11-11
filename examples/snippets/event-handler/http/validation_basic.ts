import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import { z } from 'zod';

const app = new Router();

// Define schemas
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
});

// Validate request body
app.post(
  '/users',
  async () => {
    return {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date().toISOString(),
    };
  },
  {
    validation: { req: { body: createUserSchema } },
  }
);

// Validate both request and response
app.get(
  '/users/:id',
  async (reqCtx) => {
    const { id } = reqCtx.params;

    return {
      id,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date().toISOString(),
    };
  },
  {
    validation: {
      req: { path: z.object({ id: z.string().uuid() }) },
      res: { body: userResponseSchema },
    },
  }
);

export const handler = app.resolve.bind(app);
