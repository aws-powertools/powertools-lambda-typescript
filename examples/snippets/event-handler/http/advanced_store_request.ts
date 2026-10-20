declare const getUserProfile: (
  userId: string
) => Promise<{ name: string; email: string }>;
declare const jwt: {
  verify(token: string, secret: string): { sub: string };
};

import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';

const app = new Router();

// Middleware sets a value in the request store
app.use(async ({ reqCtx, next }) => {
  const auth = reqCtx.req.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  const { sub } = jwt.verify(token, 'secret');

  reqCtx.set('userId', sub); // (1)!

  await next();
});

app.get('/profile', async (reqCtx) => {
  const userId = reqCtx.get('userId'); // (2)!
  if (!userId) return { error: 'Not authenticated' };

  const profile = await getUserProfile(userId as string);
  return { profile };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
