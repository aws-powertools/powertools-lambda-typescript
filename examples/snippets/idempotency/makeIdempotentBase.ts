import { randomUUID } from 'node:crypto';
import { makeIdempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
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

export const handler = makeIdempotent(
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
  },
  {
    persistenceStore,
  }
);
