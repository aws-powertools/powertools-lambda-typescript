import { CachePersistenceLayer } from '@aws-lambda-powertools/idempotency/cache';
import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
import middy from '@middy/core';
import { createClient } from '@redis/client';
import type { Context } from 'aws-lambda';
import type { Request, Response } from './types.js';

// Initialize the Redis client
const client = await createClient({
  url: `rediss://${process.env.CACHE_ENDPOINT}:${process.env.CACHE_PORT}`,
  username: 'default',
}).connect();

const persistenceStore = new CachePersistenceLayer({
  client,
  expiryAttr: 'expiresAt',
  inProgressExpiryAttr: 'inProgressExpiresAt',
  statusAttr: 'currentStatus',
  dataAttr: 'resultData',
  validationKeyAttr: 'validationKey',
});

export const handler = middy(
  async (_event: Request, _context: Context): Promise<Response> => {
    try {
      // ... create payment

      return {
        paymentId: '1234567890',
        message: 'success',
        statusCode: 200,
      };
    } catch (error) {
      throw new Error('Error creating payment');
    }
  }
).use(
  makeHandlerIdempotent({
    persistenceStore,
  })
);
