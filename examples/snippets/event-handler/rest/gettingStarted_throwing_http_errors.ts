declare function isAuthenticated(token: string): boolean;

import {
  Router,
  UnauthorizedError,
} from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Context } from 'aws-lambda';

const app = new Router();

app.use(async ({ reqCtx, next }) => {
  if (!isAuthenticated(reqCtx.req.headers.get('Authorization') ?? '')) {
    throw new UnauthorizedError(); // This will return a 401 Unauthorized response
  }
  await next();
});

app.get('/secure', async () => {
  return { message: 'super important data' };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
