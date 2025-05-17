import { CachePersistenceLayer } from '@aws-lambda-powertools/idempotency/cache';
import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
import middy from '@middy/core';
import { GlideClient } from '@valkey/valkey-glide';
import type { Context } from 'aws-lambda';
import type { Request, Response } from './types.js';

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

const persistenceStore = new CachePersistenceLayer({
  client,
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
