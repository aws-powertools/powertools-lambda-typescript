import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';

const app = new Router();

app.post('/todos', () => ({
  statusCode: 201, // (1)!
  headers: { 'x-todo-id': '123' }, // (2)!
  body: { id: '123', title: 'Buy milk' }, // (3)!
}));

app.get('/todos', () => ({
  statusCode: 200,
  body: [
    { id: '1', title: 'Buy milk' },
    { id: '2', title: 'Take out trash' },
  ], // (4)!
}));

app.delete('/todos/:id', () => ({
  statusCode: 204, // (5)!
}));

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
