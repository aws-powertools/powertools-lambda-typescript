import { Logger } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { IdempotencyConfig } from '../../src/IdempotencyConfig.js';
import { makeHandlerIdempotent } from '../../src/middleware/makeHandlerIdempotent.js';
import { DynamoDBPersistenceLayer } from '../../src/persistence/DynamoDBPersistenceLayer.js';

const IDEMPOTENCY_TABLE_NAME =
  process.env.IDEMPOTENCY_TABLE_NAME || 'table_name';

const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
});
const logger = new Logger();

/**
 * Test handler with sequential execution.
 */
export const handler = middy(
  async (event: { foo: string }, context: Context) => {
    logger.addContext(context);
    logger.info('foo', { details: event.foo });

    return event.foo;
  }
).use(
  makeHandlerIdempotent({
    persistenceStore: dynamoDBPersistenceLayer,
  })
);

/**
 * Test handler with parallel execution.
 *
 * We put a 1.5s delay in the handler to ensure that it doesn't return
 * before the second call is made. This way the slowest call will be
 * rejected and the fastest will be processed.
 */
export const handlerParallel = middy(
  async (event: { foo: string }, context: Context) => {
    logger.addContext(context);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    logger.info('Processed event', { details: event.foo });

    return event.foo;
  }
).use(
  makeHandlerIdempotent({
    persistenceStore: dynamoDBPersistenceLayer,
  })
);

/**
 * Test handler with timeout and JMESPath expression to extract the
 * idempotency key.
 *
 * We put a 2s delay in the handler to ensure that it will timeout
 * (timeout is set to 2s). By the time the second call is made, the
 * first idempotency record has expired.
 */
export const handlerTimeout = middy(
  async (event: { foo: string; invocation: number }, context: Context) => {
    logger.addContext(context);

    if (event.invocation === 0) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }

    logger.info('Processed event', {
      details: event.foo,
    });

    return {
      foo: event.foo,
      invocation: event.invocation,
    };
  }
).use(
  makeHandlerIdempotent({
    persistenceStore: dynamoDBPersistenceLayer,
    config: new IdempotencyConfig({
      eventKeyJmesPath: 'foo',
    }),
  })
);

/**
 * Test handler with expired idempotency record.
 *
 * We configure the idempotency utility to expire records after 1s.
 * By the time the second call is made, the first idempotency record
 * has expired. The second call will be processed. We include a JMESPath
 * expression to extract the idempotency key (`foo`) but we return the
 * invocation number as well so that we can check that the second call
 * was processed by looking at the value in the stored idempotency record.
 */
export const handlerExpired = middy(
  async (event: { foo: string; invocation: number }, context: Context) => {
    logger.addContext(context);

    logger.info('Processed event', { details: event.foo });

    return {
      foo: event.foo,
      invocation: event.invocation,
    };
  }
).use(
  makeHandlerIdempotent({
    persistenceStore: dynamoDBPersistenceLayer,
    config: new IdempotencyConfig({
      useLocalCache: false,
      expiresAfterSeconds: 1,
      eventKeyJmesPath: 'foo',
    }),
  })
);
