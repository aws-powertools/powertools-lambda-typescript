import {
  type DurableContext,
  withDurableExecution,
} from '@aws/durable-execution-sdk-js';
import { Logger } from '@aws-lambda-powertools/logger';
import { makeIdempotent } from '../../src/makeIdempotent.js';
import { DynamoDBPersistenceLayer } from '../../src/persistence/DynamoDBPersistenceLayer.js';

const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer({
  tableName: process.env.IDEMPOTENCY_TABLE_NAME || 'table_name',
});

const logger = new Logger();

/**
 * Durable function with wait step for testing idempotency.
 */
export const handler = withDurableExecution(
  makeIdempotent(
    async (event: { foo: string }, context: DurableContext) => {
      logger.info('Processing event', { foo: event.foo });

      await context.wait({ seconds: 1 });

      logger.info('After wait');

      return `processed: ${event.foo}`;
    },
    {
      persistenceStore: dynamoDBPersistenceLayer,
    }
  )
);
