import { makeIdempotent } from '@aws-lambda-powertools/idempotency';
import { CachePersistenceLayer } from '@aws-lambda-powertools/idempotency/cache';
import { GlideClient } from '@valkey/valkey-glide';
import type { Context } from 'aws-lambda';

// Initialize the Glide client
const client = await GlideClient.createClient({
  addresses: [
    {
      host: process.env.CACHE_ENDPOINT,
      port: Number(process.env.CACHE_PORT),
    },
  ],
  useTLS: true,
  requestTimeout: 5000,
});

const cachePersistenceStore = new CachePersistenceLayer({
  client,
});

const handler = async (event: unknown, context: Context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      paymentId: '123',
      message: 'Payment created',
    }),
  };
};

const idempotentHandler = makeIdempotent(handler, {
  persistenceStore: cachePersistenceStore,
});

export { idempotentHandler, handler };
