import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'IdempotencyTable',
});

// Requires "user"."uid" and "orderId" to be present
const config = new IdempotencyConfig({
  eventKeyJmesPath: '[user.uid, orderId]',
  throwOnNoIdempotencyKey: true,
});

export const handler = makeIdempotent((_event: unknown) => ({}), {
  persistenceStore,
  config,
});
