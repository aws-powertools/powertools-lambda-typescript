import { randomUUID } from 'node:crypto';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
import middy from '@middy/core';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

export const handler = middy()
  .use(
    makeHandlerIdempotent({
      persistenceStore,
      keyPrefix: 'createSubscriptionPayment',
    })
  )
  .handler(async () => {
    try {
      // ... create payment

      return {
        paymentId: randomUUID(),
        message: 'success',
        statusCode: 200,
      };
    } catch (error) {
      throw new Error('Error creating payment');
    }
  });
