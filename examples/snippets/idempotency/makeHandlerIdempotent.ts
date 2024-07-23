import { randomUUID } from 'node:crypto';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import type { Request, Response, SubscriptionResult } from './types.js';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

const createSubscriptionPayment = async (
  event: Request
): Promise<SubscriptionResult> => {
  // ... create payment
  return {
    id: randomUUID(),
    productId: event.productId,
  };
};

export const handler = middy(
  async (event: Request, _context: Context): Promise<Response> => {
    try {
      const payment = await createSubscriptionPayment(event);

      return {
        paymentId: payment.id,
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
