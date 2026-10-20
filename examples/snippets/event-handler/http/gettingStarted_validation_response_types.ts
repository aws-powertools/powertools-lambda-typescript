import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';
import { z } from 'zod';

const app = new Router();

const createTodoSchema = z.object({ title: z.string() });

type Todo = { id: string; title: string; completed: boolean };

app.post(
  '/todos',
  (reqCtx): Todo => {
    // (1)!
    const { title } = reqCtx.valid.req.body;
    return { id: '123', title, completed: false };
  },
  {
    validation: { req: { body: createTodoSchema } }, // (2)!
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
