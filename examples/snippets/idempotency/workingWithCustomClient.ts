import { makeIdempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { Context } from 'aws-lambda';
import type { Request, Response } from './types.js';

const customDynamoDBClient = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
});
const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
  awsSdkV3Client: customDynamoDBClient,
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
