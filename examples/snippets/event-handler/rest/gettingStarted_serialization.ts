import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';

const app = new Router();

app.get('/ping', async () => {
  return { message: 'pong' }; // (1)!
});

export const handler = app.resolve;
