declare const getAllTodos: () => Promise<Record<string, string>[]>;
declare const putTodo: (body: unknown) => Promise<Record<string, string>>;

import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Context } from 'aws-lambda';
import { apiMiddleware } from './advanced_mw_compose_middleware_shared.js';

const app = new Router();

app.use(apiMiddleware);

app.get('/todos', async () => {
  const todos = await getAllTodos();
  return { todos };
});

app.post('/todos', async (_, { request }) => {
  const body = await request.json();
  const todo = await putTodo(body);
  return todo;
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
