declare function getAllTodos(): Promise<{ id: string; title: string }[]>;

import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Middleware } from '@aws-lambda-powertools/event-handler/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const app = new Router({ logger });

// Authentication middleware - returns early if no auth header
const authMiddleware: Middleware = async ({ reqCtx, next }) => {
  const authHeader = reqCtx.req.headers.get('authorization');

  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await next();
};

// Logging middleware - never executes when auth fails
const loggingMiddleware: Middleware = async ({ next }) => {
  logger.info('Request processed');
  await next();
};

app.use(authMiddleware);
app.use(loggingMiddleware);

app.get('/todos', async () => {
  const todos = await getAllTodos();
  return { todos };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
