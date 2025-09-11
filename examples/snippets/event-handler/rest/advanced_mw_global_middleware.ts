declare function getAllTodos(): Promise<{ id: string; title: string }[]>;
declare function putTodo<T>(todo: unknown): Promise<{ id: string } & T>;

import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const app = new Router({ logger });

// Logging middleware - runs for all routes
app.use(async (params, reqCtx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  logger.info('Request completed', {
    path: reqCtx.request.url,
    duration,
  });
});

app.get('/todos', async () => {
  const todos = await getAllTodos();
  return { todos };
});

app.post('/todos', async (params, { request }) => {
  const body = await request.json();
  const todo = await putTodo(body);
  return todo;
});

export const handler = async (event: unknown, context: Context) => {
  return app.resolve(event, context);
};
