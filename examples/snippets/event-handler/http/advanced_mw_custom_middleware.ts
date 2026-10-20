declare const processOrder: (
  orderId: string,
  correlationId: string
) => Promise<{ status: string }>;

import { randomUUID } from 'node:crypto';
import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Middleware } from '@aws-lambda-powertools/event-handler/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

type AppEnv = {
  store: {
    request: { correlationId: string };
  };
};

const logger = new Logger({});
const app = new Router<AppEnv>();

// Factory function that returns middleware
const correlationId = (options: { header: string }): Middleware<AppEnv> => {
  return async ({ reqCtx, next }) => {
    const id = reqCtx.req.headers.get(options.header) ?? randomUUID();

    reqCtx.set('correlationId', id);
    logger.appendKeys({ correlationId: id });

    await next();
  };
};

// Use custom middleware globally
app.use(correlationId({ header: 'X-Correlation-Id' }));

app.post('/orders', async (reqCtx) => {
  const id = reqCtx.get('correlationId') ?? randomUUID();
  const result = await processOrder('order-123', id);
  return { correlationId: id, ...result };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
