declare function processPayment(): Promise<{
  paymentId: string;
}>;

import { CachePersistenceLayer } from '@aws-lambda-powertools/idempotency/cache';
import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
import middy from '@middy/core';
import { GlideClient } from '@valkey/valkey-glide';
import type { Context } from 'aws-lambda';

const client = await GlideClient.createClient({
  addresses: [
    {
      host: String(process.env.CACHE_ENDPOINT),
      port: Number(process.env.CACHE_PORT),
    },
  ],
  useTLS: true,
  requestTimeout: 5000,
});

const persistenceStore = new CachePersistenceLayer({
  client,
  expiryAttr: 'expiresAt',
  inProgressExpiryAttr: 'inProgressExpiresAt',
  statusAttr: 'currentStatus',
  dataAttr: 'resultData',
  validationKeyAttr: 'validationKey',
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
