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
const config = new IdempotencyConfig({
  eventKeyJmesPath: '["userId", "productId"]',
  payloadValidationJmesPath: 'amount',
});

const fetchProductAmount = async (_transactionId: string): Promise<number> => {
  // ... fetch product amount
  return 42;
};

const createSubscriptionPayment = makeIdempotent(
  async (event: Request & { amount: number }): Promise<SubscriptionResult> => {
    // ... create payment
    return {
      id: randomUUID(),
      productId: event.productId,
    };
  },
  {
    persistenceStore,
    dataIndexArgument: 1,
    config,
  }
);

export const handler = async (
  event: Request,
  context: Context
): Promise<Response> => {
  config.registerLambdaContext(context);
  try {
    const productAmount = await fetchProductAmount(event.productId);
    const payment = await createSubscriptionPayment({
      ...event,
      amount: productAmount,
    });

    return {
      paymentId: payment.id,
      message: 'success',
      statusCode: 200,
    };
  } catch (error) {
    throw new Error('Error creating payment');
  }
};
