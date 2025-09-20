import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Middleware } from '@aws-lambda-powertools/event-handler/types';
import type { Context } from 'aws-lambda';

const app = new Router();

// ❌ WRONG: Using destructuring captures a reference to the original response
const _badMiddleware: Middleware = async (_, { res }, next) => {
  res.headers.set('X-Before', 'Before');
  await next();
  // This header will NOT be added because 'res' is a stale reference
  res.headers.set('X-After', 'After');
};

// ✅ CORRECT: Always access response through reqCtx
const goodMiddleware: Middleware = async (_, reqCtx, next) => {
  reqCtx.res.headers.set('X-Before', 'Before');
  await next();
  // This header WILL be added because we get the current response
  reqCtx.res.headers.set('X-After', 'After');
};

app.use(goodMiddleware);

app.get('/test', async () => {
  return { message: 'Hello World!' };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
