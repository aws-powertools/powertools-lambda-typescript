import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';
import { z } from 'zod';

const app = new Router();

const responseHeaderSchema = z.object({
  'x-correlation-id': z.string().uuid(), // (1)!
  'x-max-age': z.coerce.number().int().nonnegative(), // (3)!
});

app.get(
  '/todos/:id',
  ({ params }) => {
    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': crypto.randomUUID(),
        'x-max-age': 300,
      },
      body: { id: params.id, title: 'Buy milk' },
    };
  },
  {
    validation: { res: { headers: responseHeaderSchema } }, // (2)!
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
