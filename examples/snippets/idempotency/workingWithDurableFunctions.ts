import {
  type DurableContext,
  withDurableExecution,
} from '@aws/durable-execution-sdk-js';
import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Request, Response } from './types.js';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

const config = new IdempotencyConfig({
  expiresAfterSeconds: 60 * 60 * 24, // at least as long as the execution timeout
});

export const handler = withDurableExecution(
  makeIdempotent(
    async (_event: Request, context: DurableContext): Promise<Response> => {
      const paymentId = await context.step('create-payment', async () => {
        // ... create payment
        return '12345';
      });

      await context.wait({ hours: 1 });

      return {
        paymentId,
        message: 'success',
        statusCode: 200,
      };
    },
    {
      persistenceStore,
      config,
    }
  )
);
