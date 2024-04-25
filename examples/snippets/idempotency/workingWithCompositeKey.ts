import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import type { Request, Response } from './types.js';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
  sortKeyAttr: 'sort_key',
});

export const handler = middy(
  async (_event: Request, _context: Context): Promise<Response> => {
    try {
      // ... create payment

      return {
        paymentId: '12345',
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
