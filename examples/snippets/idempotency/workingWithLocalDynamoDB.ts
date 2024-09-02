import { makeIdempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context } from 'aws-lambda';

const ddbPersistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'IdempotencyTable',
});

const handler = async (event: unknown, context: Context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      paymentId: '123',
      message: 'Payment created',
    }),
  };
};

const idempotentHandler = makeIdempotent(handler, {
  persistenceStore: ddbPersistenceStore,
});

export { idempotentHandler, handler };
