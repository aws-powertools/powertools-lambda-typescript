import { makeIdempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context } from 'aws-lambda';
import type { Request, Response } from './types.js';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
  clientConfig: {
    region: 'us-east-1',
  },
});

export const handler = makeIdempotent(
  async (_event: Request, _context: Context): Promise<Response> => {
    try {
      // ... create payment

      return {
        paymentId: '12345',
        message: 'success',
        statusCode: 200,
      };
    } catch (error) {
      throw new Error('Error creating payment');
    }
  },
  {
    persistenceStore,
  }
);
