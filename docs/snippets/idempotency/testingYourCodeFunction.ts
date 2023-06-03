import { makeFunctionIdempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Response } from './types';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'IdempotencyTable',
});

const myLambdaHandler = async (
  _event: unknown,
  _context: unknown
): Promise<Response> => {
  // expensive operation
  return {
    paymentId: 12345,
    message: 'success',
    statusCode: 200,
  };
};

export const handler = makeFunctionIdempotent(myLambdaHandler, {
  persistenceStore,
});
