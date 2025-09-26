declare function getAllTodos(): Promise<{ id: string; title: string }[]>;
declare function createTodo(
  title: string
): Promise<{ id: string; title: string }>;

import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const app = new Router({ logger });

app.get('/todos', async () => {
  const todos = await getAllTodos();

  return new Response(JSON.stringify({ todos }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=300',
      'X-Custom-Header': 'custom-value',
    },
  });
});

app.post('/todos', async ({ req }) => {
  const body = await req.json();
  const todo = await createTodo(body.title);

  return new Response(JSON.stringify(todo), {
    status: 201,
    headers: {
      Location: `/todos/${todo.id}`,
      'Content-Type': 'application/json',
    },
  });
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
