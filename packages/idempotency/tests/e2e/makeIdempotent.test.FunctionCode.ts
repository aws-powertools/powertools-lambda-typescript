import type { Context } from 'aws-lambda';
import { DynamoDBPersistenceLayer } from '../../src/persistence/DynamoDBPersistenceLayer.js';
import { makeIdempotent } from '../../src/makeIdempotent.js';
import { Logger } from '@aws-lambda-powertools/logger';
import { IdempotencyConfig } from '../../src/IdempotencyConfig.js';

const IDEMPOTENCY_TABLE_NAME =
  process.env.IDEMPOTENCY_TABLE_NAME || 'table_name';

// Default persistence layer
const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
});

// Customized persistence layer
const ddbPersistenceLayerCustomized = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
  dataAttr: 'dataAttr',
  keyAttr: 'customId',
  expiryAttr: 'expiryAttr',
  statusAttr: 'statusAttr',
  inProgressExpiryAttr: 'inProgressExpiryAttr',
  staticPkValue: 'staticPkValue',
  validationKeyAttr: 'validationKeyAttr',
});

const logger = new Logger();

/**
 * Test idempotent arbitrary function with default persistence layer configs.
 */
const idempotencyConfig = new IdempotencyConfig({});
const processIdempotently = makeIdempotent(
  (record: Record<string, unknown>): string => {
    logger.info('Got test event', { record });

    return `Processing done: ${record.foo}`;
  },
  {
    persistenceStore: dynamoDBPersistenceLayer,
    config: idempotencyConfig,
  }
);

export const handlerDefault = async (
  event: {
    records: Record<string, unknown>[];
  },
  context: Context
): Promise<void> => {
  idempotencyConfig.registerLambdaContext(context);
  for (const record of event.records) {
    await processIdempotently(record);
  }
};

/**
 * Test idempotent arbitrary function with customized persistence layer configs
 * and JMESPath expression to enable payload validation.
 */
const idempotencyConfigWithSelection = new IdempotencyConfig({
  payloadValidationJmesPath: 'foo',
});
const processIdempotentlyCustomized = makeIdempotent(
  (baz: number, record: Record<string, unknown>): Record<string, unknown> => {
    logger.info('Got test event', { baz, record });

    return record;
  },
  {
    persistenceStore: ddbPersistenceLayerCustomized,
    config: idempotencyConfigWithSelection,
    dataIndexArgument: 1,
  }
);

export const handlerCustomized = async (
  event: {
    records: Record<string, unknown>[];
  },
  context: Context
): Promise<void> => {
  idempotencyConfigWithSelection.registerLambdaContext(context);
  for (const [idx, record] of event.records.entries()) {
    await processIdempotentlyCustomized(idx, record);
  }
};

/**
 * Test idempotent Lambda handler with JMESPath expression to extract event key.
 */
export const handlerLambda = makeIdempotent(
  async (event: { foo: string }, context: Context) => {
    logger.addContext(context);
    logger.info(`foo`, { details: event.foo });

    return event.foo;
  },
  {
    persistenceStore: dynamoDBPersistenceLayer,
    config: new IdempotencyConfig({
      eventKeyJmesPath: 'foo',
      useLocalCache: true,
    }),
  }
);
