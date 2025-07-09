import { randomUUID } from 'node:crypto';
import { makeIdempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

export const handler = makeIdempotent(
  async () => {
    // ... create payment

    return {
      paymentId: randomUUID(),
      message: 'success',
      statusCode: 200,
    };
  },
  {
    persistenceStore,
    keyPrefix: 'createSubscriptionPayment',
  }
);
