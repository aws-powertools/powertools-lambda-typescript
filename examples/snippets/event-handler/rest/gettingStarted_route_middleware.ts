declare function getAllTodos(): Promise<{ id: string; title: string }[]>;
declare function putTodo<T>(todo: unknown): Promise<{ id: string } & T>;

import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Middleware } from '@aws-lambda-powertools/event-handler/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const app = new Router({ logger });

// Add timestamp to todo items
const addTimestamp: Middleware = async (params, reqCtx, next) => {
  const body = await reqCtx.request.json();
  body.createdAt = new Date().toISOString();
  reqCtx.request = new Request(reqCtx.request.url, {
    ...reqCtx.request,
    body: JSON.stringify(body),
  });
  await next();
};

app.get('/todos', async () => {
  const todos = await getAllTodos();
  return { todos };
});

// Route with timestamp middleware
app.post('/todos', [addTimestamp], async (params, reqCtx) => {
  const body = await reqCtx.request.json();
  const todo = await putTodo(body);
  return todo;
});

export const handler = async (event: unknown, context: Context) => {
  return app.resolve(event, context);
};
