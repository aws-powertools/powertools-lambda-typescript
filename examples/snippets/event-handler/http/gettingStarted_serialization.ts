import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';

const app = new Router();

app.get('/ping', async () => {
  return { message: 'pong' }; // (1)!
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
