import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';
import { z } from 'zod';

const app = new Router();

const createTodoSchema = z.object({ title: z.string() });

const todoResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
});

app.post(
  '/todos',
  (reqCtx) => {
    const { title } = reqCtx.valid.req.body; // (1)!
    return { id: '123', title, completed: false };
  },
  {
    validation: {
      req: { body: createTodoSchema },
      res: { body: todoResponseSchema }, // (2)!
    },
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
