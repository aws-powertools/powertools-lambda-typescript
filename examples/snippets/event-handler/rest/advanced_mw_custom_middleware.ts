declare const getUserTodos: (
  userId: string
) => Promise<Record<string, string>[]>;
declare const jwt: {
  verify(token: string, secret: string): { sub: string; roles: string[] };
};

import { getStringFromEnv } from '@aws-lambda-powertools/commons/utils/env';
import {
  Router,
  UnauthorizedError,
} from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Middleware } from '@aws-lambda-powertools/event-handler/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const jwtSecret = getStringFromEnv({
  key: 'JWT_SECRET',
  errorMessage: 'JWT_SECRET is not set',
});

const logger = new Logger({});
const app = new Router();
const store: { userId: string; roles: string[] } = { userId: '', roles: [] };

// Factory function that returns middleware
const verifyToken = (options: { jwtSecret: string }): Middleware => {
  return async ({ reqCtx: { req }, next }) => {
    const auth = req.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer '))
      throw new UnauthorizedError('Missing or invalid Authorization header');

    const token = auth.slice(7);
    try {
      const payload = jwt.verify(token, options.jwtSecret);
      store.userId = payload.sub;
      store.roles = payload.roles;
    } catch (error) {
      logger.error('Token verification failed', { error });
      throw new UnauthorizedError('Invalid token');
    }

    await next();
  };
};

// Use custom middleware globally
app.use(verifyToken({ jwtSecret }));

app.post('/todos', async () => {
  const { userId } = store;
  const todos = await getUserTodos(userId);
  return { todos };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
