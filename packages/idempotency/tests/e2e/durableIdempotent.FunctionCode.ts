import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import {
  type DurableContext,
  withDurableExecution,
} from '@aws/durable-execution-sdk-js';
import { Logger } from '@aws-lambda-powertools/logger';
import { makeIdempotent } from '../../src/makeIdempotent.js';
import { DynamoDBPersistenceLayer } from '../../src/persistence/DynamoDBPersistenceLayer.js';
import type { IdempotencyRecord } from '../../src/persistence/IdempotencyRecord.js';

const IDEMPOTENCY_TABLE_NAME =
  process.env.IDEMPOTENCY_TABLE_NAME || 'table_name';

// Default persistence layer
const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
});

/**
 * A persistence layer that takes 100 ms to complete or delete a record.
 *
 * The delay is longer than the durable execution SDK waits before suspending
 * an idle invocation, so the tests don't depend on how fast DynamoDB answers.
 */
class SlowDynamoDBPersistenceLayer extends DynamoDBPersistenceLayer {
  protected async _updateRecord(record: IdempotencyRecord): Promise<void> {
    await setTimeout(100);
    await super._updateRecord(record);
  }

  protected async _deleteRecord(record: IdempotencyRecord): Promise<void> {
    await setTimeout(100);
    await super._deleteRecord(record);
  }
}

const logger = new Logger();

type DurableEvent = {
  /**
   * Distinguishes the payloads of the test cases.
   */
  testCase: string;
  /**
   * How long the execution waits after its first step, 1 second by default.
   */
  waitSeconds?: number;
  /**
   * Whether the function throws after the wait.
   */
  fail?: boolean;
};

export const handlerDurable = withDurableExecution(
  makeIdempotent(
    async (event: DurableEvent, context: DurableContext) => {
      context.configureLogger({ customLogger: logger });

      logger.info('Processing event', { testCase: event.testCase });

      // A new execution of the function returns a new id
      const id = await context.step('generate-id', async () => randomUUID());

      await context.wait({ seconds: event.waitSeconds ?? 1 });

      logger.info('After wait');

      if (event.fail) {
        throw new Error(`Failed to process ${id}`);
      }

      return { id };
    },
    {
      persistenceStore: dynamoDBPersistenceLayer,
    }
  )
);

export const handlerDurablePendingOperation = withDurableExecution(
  makeIdempotent(
    async (event: DurableEvent, context: DurableContext) => {
      // The wait is still pending when the function settles
      const winner = await Promise.race([
        context.step('fast', async () => 'fast'),
        context.wait('timeout', { seconds: 60 }).then(() => 'timeout'),
      ]);

      if (event.fail) {
        throw new Error(`Failed after ${winner}`);
      }

      return { winner };
    },
    {
      persistenceStore: new SlowDynamoDBPersistenceLayer({
        tableName: IDEMPOTENCY_TABLE_NAME,
      }),
    }
  )
);
