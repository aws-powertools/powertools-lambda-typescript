import type { Context } from 'aws-lambda';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import {
  IdempotencyConfig,
  idempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Request, Response } from './types';

const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

const config = new IdempotencyConfig({});

class MyLambda implements LambdaInterface {
  @idempotent({ persistenceStore: dynamoDBPersistenceLayer, config: config })
  public async handler(_event: Request, _context: Context): Promise<Response> {
    // ... process your event
    return {
      message: 'success',
      statusCode: 200,
    };
  }
}

const defaultLambda = new MyLambda();
export const handler = defaultLambda.handler.bind(defaultLambda);
