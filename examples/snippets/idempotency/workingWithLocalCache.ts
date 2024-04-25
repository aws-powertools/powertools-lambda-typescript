import { IdempotencyConfig } from '@aws-lambda-powertools/idempotency';
import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import type { Request, Response } from './types.js';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});
const config = new IdempotencyConfig({
  useLocalCache: true,
  maxLocalCacheSize: 512,
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
    config,
  })
);
