declare function getAllTodos(): Promise<{ id: string; title: string }[]>;
declare function putTodo<T>(todo: unknown): Promise<{ id: string } & T>;

import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Middleware } from '@aws-lambda-powertools/event-handler/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const app = new Router({ logger });

// Global middleware - executes first in pre-processing, last in post-processing
app.use(async ({ reqCtx, next }) => {
  reqCtx.res.headers.set('x-pre-processed-by', 'global-middleware');
  await next();
  reqCtx.res.headers.set('x-post-processed-by', 'global-middleware');
});

// Route-specific middleware - executes second in pre-processing, first in post-processing
const routeMiddleware: Middleware = async ({ reqCtx, next }) => {
  reqCtx.res.headers.set('x-pre-processed-by', 'route-middleware');
  await next();
  reqCtx.res.headers.set('x-post-processed-by', 'route-middleware');
};

app.get('/todos', async () => {
  const todos = await getAllTodos();
  return { todos };
});

// This route will have:
// x-pre-processed-by: route-middleware (route middleware overwrites global)
// x-post-processed-by: global-middleware (global middleware executes last)
app.post('/todos', [routeMiddleware], async ({ req }) => {
  const body = await req.json();
  const todo = await putTodo(body);
  return todo;
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
