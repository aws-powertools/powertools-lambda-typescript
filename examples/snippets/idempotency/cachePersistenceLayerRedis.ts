declare function processPayment(): Promise<{
  paymentId: string;
}>;

import { CachePersistenceLayer } from '@aws-lambda-powertools/idempotency/cache';
import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
import middy from '@middy/core';
import { createClient } from '@redis/client';
import type { Context } from 'aws-lambda';

const client = await createClient({
  url: `rediss://${process.env.CACHE_ENDPOINT}:${process.env.CACHE_PORT}`,
  username: 'default',
}).connect();

const persistenceStore = new CachePersistenceLayer({
  client,
});

export const handler = middy(async (_event: unknown, _context: Context) => {
  const payment = await processPayment();

  return {
    paymentId: payment?.paymentId,
    message: 'success',
    statusCode: 200,
  };
}).use(
  makeHandlerIdempotent({
    persistenceStore,
  })
);
