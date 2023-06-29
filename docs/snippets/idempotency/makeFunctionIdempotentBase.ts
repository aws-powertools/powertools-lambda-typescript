import { makeFunctionIdempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context } from 'aws-lambda';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

export const handler = makeFunctionIdempotent(
  async (_event: unknown, _context: unknown): Promise<void> => {
    // your code goes here here
  },
  {
    persistenceStore,
  }
);
