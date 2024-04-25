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
const config = new IdempotencyConfig({});

const reportSubscriptionMetrics = async (
  _transactionId: string,
  _user: string
): Promise<void> => {
  // ... send notification
};

const createSubscriptionPayment = makeIdempotent(
  async (
    transactionId: string,
    event: Request
  ): Promise<SubscriptionResult> => {
    // ... create payment
    return {
      id: transactionId,
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
    const transactionId = randomUUID();
    const payment = await createSubscriptionPayment(transactionId, event);

    await reportSubscriptionMetrics(transactionId, event.user);

    return {
      paymentId: payment.id,
      message: 'success',
      statusCode: 200,
    };
  } catch (error) {
    throw new Error('Error creating payment');
  }
};
