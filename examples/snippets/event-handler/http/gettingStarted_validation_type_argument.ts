import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';

const app = new Router();

type Todo = { id: string; title: string; completed: boolean };

app.get<Todo>('/todos/:id', ({ params }) => {
  // (1)!
  return { id: params.id, title: 'Buy milk', completed: false };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
