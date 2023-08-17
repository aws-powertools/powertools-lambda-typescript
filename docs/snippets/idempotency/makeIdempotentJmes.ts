import { randomUUID } from 'node:crypto';
import {
  makeIdempotent,
  IdempotencyConfig,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context } from 'aws-lambda';
import type { Request, Response, SubscriptionResult } from './types';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

const createSubscriptionPayment = async (
  user: string,
  productId: string
): Promise<SubscriptionResult> => {
  // ... create payment
  return {
    id: randomUUID(),
    productId: productId,
  };
};

// Extract the idempotency key from the request headers
const config = new IdempotencyConfig({
  eventKeyJmesPath: 'body',
});

export const handler = makeIdempotent(
  async (event: Request, _context: Context): Promise<Response> => {
    try {
      const payment = await createSubscriptionPayment(
        event.user,
        event.productId
      );

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
    config,
  }
);
