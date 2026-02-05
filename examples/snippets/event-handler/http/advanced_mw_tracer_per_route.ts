import { Router } from '@aws-lambda-powertools/event-handler/http';
import { tracer as tracerMiddleware } from '@aws-lambda-powertools/event-handler/http/middleware/tracer';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Context } from 'aws-lambda';

const tracer = new Tracer({ serviceName: 'my-api' });
const app = new Router();

app.get(
  '/users/cards',
  [tracerMiddleware(tracer, { captureResponse: false })],
  ({ params }) => {
    return { id: params.id, secret: 'sensitive-data' };
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
