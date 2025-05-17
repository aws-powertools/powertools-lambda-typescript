import { makeIdempotent } from '@aws-lambda-powertools/idempotency';
import { CachePersistenceLayer } from '@aws-lambda-powertools/idempotency/cache';
import { createClient } from '@redis/client';
import type { Context } from 'aws-lambda';

// Initialize the Redis client
const client = await createClient({
  url: `rediss://${process.env.CACHE_ENDPOINT}:${process.env.CACHE_PORT}`,
  username: 'default',
}).connect();

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
