declare const jwt: {
  verify(token: string, secret: string): { sub: string; isAdmin: boolean };
};
declare const createDbClient: () => {
  query: (sql: string) => Promise<unknown>;
};

import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';

type AppEnv = {
  store: {
    request: { userId: string; isAdmin: boolean }; // (1)!
    shared: { db: { query: (sql: string) => Promise<unknown> } }; // (2)!
  };
};

const app = new Router<AppEnv>();

// Shared store is typed — only accepts keys defined in AppEnv
app.shared.set('db', createDbClient()); // (3)!

app.use(async ({ reqCtx, next }) => {
  const auth = reqCtx.req.headers.get('Authorization') ?? '';
  const { sub, isAdmin } = jwt.verify(auth.replace('Bearer ', ''), 'secret');

  reqCtx.set('userId', sub); // (4)!
  reqCtx.set('isAdmin', isAdmin);

  await next();
});

app.get('/profile', async (reqCtx) => {
  const userId = reqCtx.get('userId'); // (5)!
  const db = reqCtx.shared.get('db'); // (6)!

  // @ts-expect-error - 'email' is not a key defined in AppEnv
  reqCtx.get('email'); // (7)!

  if (!userId || !db) return { error: 'not ready' };
  return { userId };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
