import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';
import { z } from 'zod';

const app = new Router();

const todoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
});

app.get(
  '/todos/:id',
  ({ params }) => {
    return { id: params.id, title: 'Buy milk', completed: false };
  },
  {
    validation: { res: { body: todoSchema } }, // (1)!
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
