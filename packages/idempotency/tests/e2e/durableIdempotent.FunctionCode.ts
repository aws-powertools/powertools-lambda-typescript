import {
  type DurableContext,
  withDurableExecution,
} from '@aws/durable-execution-sdk-js';
import { Logger } from '@aws-lambda-powertools/logger';
import { makeIdempotent } from '../../src/makeIdempotent.js';
import { DynamoDBPersistenceLayer } from '../../src/persistence/DynamoDBPersistenceLayer.js';

const IDEMPOTENCY_TABLE_NAME =
  process.env.IDEMPOTENCY_TABLE_NAME || 'table_name';

// Default persistence layer
const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
});

const logger = new Logger();

export const handlerDurable = withDurableExecution(
  makeIdempotent(
    async (event: { foo: string }, context: DurableContext) => {
      context.configureLogger({ customLogger: logger });

      logger.info('Processing event', { foo: event.foo });

      await context.wait({ seconds: 1 });

      logger.info('After wait');

      return event.foo;
    },
    {
      persistenceStore: dynamoDBPersistenceLayer,
    }
  )
);
