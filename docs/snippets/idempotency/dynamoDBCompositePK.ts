import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import middy from '@middy/core';
import type { Request, Response } from './types';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'IdempotencyTable',
  sortKeyAttr: 'sort_key',
});

export const handler = middy(
  async (event: Request, _context: unknown): Promise<Response> => ({
    message: 'success',
    id: event.email,
  })
).use(
  makeHandlerIdempotent({
    persistenceStore,
  })
);
