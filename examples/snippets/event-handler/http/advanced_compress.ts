declare function getTodoById<T>(todoId: unknown): Promise<{ id: string } & T>;

import { Router } from '@aws-lambda-powertools/event-handler/http';
import { compress } from '@aws-lambda-powertools/event-handler/http/middleware';
import type { Context } from 'aws-lambda';

const app = new Router();

app.use(compress());

app.get('/todos/:todoId', async ({ params: { todoId } }) => {
  const todo = await getTodoById(todoId);
  return { todo };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
