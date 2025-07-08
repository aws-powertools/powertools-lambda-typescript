import { randomUUID } from 'node:crypto';
import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import type { Context } from 'aws-lambda';
import { CustomPersistenceLayer } from './advancedBringYourOwnPersistenceLayer';
import type { Request, Response, SubscriptionResult } from './types.js';

const persistenceStore = new CustomPersistenceLayer({
  collectionName: 'powertools',
});
const config = new IdempotencyConfig({
  expiresAfterSeconds: 60,
});

const createSubscriptionPayment = makeIdempotent(
  async (
    _transactionId: string,
    event: Request
  ): Promise<SubscriptionResult> => {
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

  const transactionId = randomUUID();
  const payment = await createSubscriptionPayment(transactionId, event);

  return {
    paymentId: payment.id,
    message: 'success',
    statusCode: 200,
  };
};
