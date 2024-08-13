import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';

const idempotencyConfig = new IdempotencyConfig({});
const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotency-store',
});

const handler = async (event: unknown, context: unknown) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success', event: event }),
  };
};

const idempotentHandler = makeIdempotent(handler, {
  config: idempotencyConfig,
  persistenceStore: persistenceStore,
});

export { idempotentHandler };
