import { randomUUID } from 'node:crypto';
import { idempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context } from 'aws-lambda';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

class Lambda {
  @idempotent({
    persistenceStore,
    keyPrefix: 'createSubscriptionPayment',
  })
  async handler(_event: unknown, _context: Context) {
    try {
      // ... create payment

      return {
        paymentId: randomUUID(),
        message: 'success',
        statusCode: 200,
      };
    } catch (_error) {
      throw new Error('Error creating payment');
    }
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
