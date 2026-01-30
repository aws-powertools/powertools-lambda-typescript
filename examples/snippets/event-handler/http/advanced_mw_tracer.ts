import { Router } from '@aws-lambda-powertools/event-handler/http';
import { tracer as tracerMiddleware } from '@aws-lambda-powertools/event-handler/http/middleware/tracer';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Context } from 'aws-lambda';

const tracer = new Tracer({ serviceName: 'my-api' });
const app = new Router();

// Apply globally
app.use(tracerMiddleware(tracer));

app.get('/users', () => {
  return { users: [{ id: '1', name: 'John' }] };
});

app.get('/users/:id', ({ params }) => {
  return { id: params.id, name: 'John' };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
