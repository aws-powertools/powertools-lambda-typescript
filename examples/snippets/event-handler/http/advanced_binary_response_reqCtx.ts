import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';

const app = new Router();

app.get('/json64', async (reqCtx) => {
  reqCtx.isBase64Encoded = true;
  return { message: 'Hello World!' };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
