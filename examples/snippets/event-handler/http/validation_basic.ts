import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import { validation } from '@aws-lambda-powertools/event-handler/experimental-rest/middleware';
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
app.post('/users', {
  middleware: [validation({ req: { body: createUserSchema } })],
}, async (reqCtx) => {
  const body = reqCtx.req.body;
  // body is typed as { name: string; email: string; age?: number }
  
  return {
    statusCode: 201,
    body: {
      id: '123',
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString(),
    },
  };
});

// Validate both request and response
app.get('/users/:id', {
  middleware: [validation({
    req: { path: z.object({ id: z.string().uuid() }) },
    res: { body: userResponseSchema },
  })],
}, async (reqCtx) => {
  const { id } = reqCtx.params;
  
  return {
    body: {
      id,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date().toISOString(),
    },
  };
});

export const handler = app.resolve.bind(app);
