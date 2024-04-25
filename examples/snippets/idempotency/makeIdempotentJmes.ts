import { randomUUID } from 'node:crypto';
import {
  makeIdempotent,
  IdempotencyConfig,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context } from 'aws-lambda';
import type { Request, Response, SubscriptionResult } from './types.js';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

const createSubscriptionPayment = async (
  _user: string,
  productId: string
): Promise<SubscriptionResult> => {
  // ... create payment
  return {
    id: randomUUID(),
    productId: productId,
  };
};

// Deserialize JSON string under the "body" key, then extract the "user" and "productId" keys
const config = new IdempotencyConfig({
  eventKeyJmesPath: 'powertools_json(body).["user", "productId"]',
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
