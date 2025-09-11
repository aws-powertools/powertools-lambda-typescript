declare const getAllTodos: () => Promise<any[]>;
declare const putTodo: (body: any) => Promise<any>;

import {
  composeMiddleware,
  Router,
} from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Middleware } from '@aws-lambda-powertools/event-handler/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();

// Individual middleware functions
const logging: Middleware = async (params, reqCtx, next) => {
  logger.info(`Request: ${reqCtx.request.method} ${reqCtx.request.url}`);
  await next();
  logger.info(`Response: ${reqCtx.res.status}`);
};

const cors: Middleware = async (params, reqCtx, next) => {
  await next();
  reqCtx.res.headers.set('Access-Control-Allow-Origin', '*');
  reqCtx.res.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE'
  );
};

const rateLimit: Middleware = async (params, reqCtx, next) => {
  // Rate limiting logic would go here
  reqCtx.res.headers.set('X-RateLimit-Limit', '100');
  await next();
};

// Compose middleware stack for all requests
const apiMiddleware = composeMiddleware([logging, cors, rateLimit]);

const app = new Router();

// Use composed middleware globally
app.use(apiMiddleware);

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
  return await app.resolve(event, context);
};
