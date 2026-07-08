import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { Context } from 'aws-lambda';
import type { Request, Response } from './types.js';

// You can share the same AWS SDK client across persistence layer instances
const dynamoDBClient = new DynamoDBClient({});

const processUser = makeIdempotent(
  async (user: { userId: string }) => {
    // ... process user
    return { userId: user.userId };
  },
  {
    // Operations with different configs need their own persistence layer instance
    persistenceStore: new DynamoDBPersistenceLayer({
      tableName: 'idempotencyTableName',
      awsSdkV3Client: dynamoDBClient,
    }),
    config: new IdempotencyConfig({
      eventKeyJmesPath: 'userId',
    }),
  }
);

const processProduct = makeIdempotent(
  async (product: { productId: string }) => {
    // ... process product
    return { productId: product.productId };
  },
  {
    // Don't reuse the instance above: this operation has a different config
    persistenceStore: new DynamoDBPersistenceLayer({
      tableName: 'idempotencyTableName',
      awsSdkV3Client: dynamoDBClient,
    }),
    config: new IdempotencyConfig({
      eventKeyJmesPath: 'productId',
    }),
  }
);

export const handler = async (
  event: Request,
  _context: Context
): Promise<Response> => {
  const user = await processUser({ userId: event.user });
  const product = await processProduct({ productId: event.productId });

  return {
    user,
    product,
    statusCode: 200,
  };
};
