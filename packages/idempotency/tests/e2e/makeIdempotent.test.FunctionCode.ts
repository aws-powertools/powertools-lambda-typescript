import type { Context } from 'aws-lambda';
import { DynamoDBPersistenceLayer } from '../../src/persistence/DynamoDBPersistenceLayer';
import { makeIdempotent } from '../../src';
import { Logger } from '@aws-lambda-powertools/logger';
import { IdempotencyConfig } from '../../src';

const IDEMPOTENCY_TABLE_NAME =
  process.env.IDEMPOTENCY_TABLE_NAME || 'table_name';
const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
});

const ddbPersistenceLayerCustomized = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
  dataAttr: 'dataattr',
  keyAttr: 'customId',
  expiryAttr: 'expiryattr',
  statusAttr: 'statusattr',
  inProgressExpiryAttr: 'inprogressexpiryattr',
  staticPkValue: 'staticpkvalue',
  validationKeyAttr: 'validationkeyattr',
});

interface EventRecords {
  records: Record<string, unknown>[];
}

const logger = new Logger();

const processRecord = (record: Record<string, unknown>): string => {
  logger.info(`Got test event: ${JSON.stringify(record)}`);

  return 'Processing done: ' + record['foo'];
};

const idempotencyConfig = new IdempotencyConfig({});
const processIdempotently = makeIdempotent(processRecord, {
  persistenceStore: dynamoDBPersistenceLayer,
});

export const handler = async (
  event: EventRecords,
  context: Context
): Promise<void> => {
  idempotencyConfig.registerLambdaContext(context);
  for (const record of event.records) {
    const result = processIdempotently(record);
    logger.info(result.toString());
  }

  return Promise.resolve();
};

const idempotencyConfigWithSelection = new IdempotencyConfig({
  eventKeyJmesPath: 'foo',
});
const processIdempotentlyCustomized = makeIdempotent(processRecord, {
  persistenceStore: ddbPersistenceLayerCustomized,
  config: idempotencyConfigWithSelection,
});

export const handlerCustomized = async (
  event: EventRecords,
  context: Context
): Promise<void> => {
  idempotencyConfigWithSelection.registerLambdaContext(context);
  for (const record of event.records) {
    const result = processIdempotentlyCustomized(record);
    logger.info(result.toString());
  }

  return Promise.resolve();
};
