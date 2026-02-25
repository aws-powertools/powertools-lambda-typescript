import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';
import { z } from 'zod';

const app = new Router();

const createTodoSchema = z.object({
  title: z.string(),
  completed: z.boolean().optional().default(false),
});

app.post(
  '/todos',
  (reqCtx) => {
    const { title, completed } = reqCtx.valid.req.body; // (1)!
    return { id: '123', title, completed };
  },
  {
    validation: { req: { body: createTodoSchema } },
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
