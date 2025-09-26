declare function getUserTodos(auth: string | null): Promise<{ id: string }>;

import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Context } from 'aws-lambda';

const app = new Router({ prefix: '/todos' });

// matches POST /todos
app.post('/', async ({ req: { headers } }) => {
  const todos = await getUserTodos(headers.get('Authorization'));
  return { todos };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
