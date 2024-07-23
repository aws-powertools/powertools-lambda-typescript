import { randomUUID } from 'node:crypto';
import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context } from 'aws-lambda';
import type { Request, Response, SubscriptionResult } from './types.js';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});
const config = new IdempotencyConfig({});

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
  /**
   * If an exception is thrown before the wrapped function is called,
   * no idempotency record is created.
   */
  try {
    const transactionId = randomUUID();
    const payment = await createSubscriptionPayment(transactionId, event);

    /**
     * If an exception is thrown after the wrapped function is called,
     * the idempotency record won't be affected so it's safe to retry.
     */

    return {
      paymentId: payment.id,
      message: 'success',
      statusCode: 200,
    };
  } catch (error) {
    throw new Error('Error creating payment');
  }
};
