import type { Context } from 'aws-lambda';
import { DynamoDBPersistenceLayer } from '../../src/persistence/DynamoDBPersistenceLayer';
import { makeFunctionIdempotent } from '../../src';
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

const processIdempotently = makeFunctionIdempotent(processRecord, {
  persistenceStore: dynamoDBPersistenceLayer,
  dataKeywordArgument: 'foo',
  config: idempotencyConfig,
});

export const handler = async (
  _event: EventRecords,
  _context: Context
): Promise<void> => {
  idempotencyConfig.registerLambdaContext(_context);
  for (const record of _event.records) {
    const result = await processIdempotently(record);
    logger.info(result.toString());
  }

  return Promise.resolve();
};

const processIdempotentlyCustomized = makeFunctionIdempotent(processRecord, {
  persistenceStore: ddbPersistenceLayerCustomized,
  dataKeywordArgument: 'foo',
  config: idempotencyConfig,
});

export const handlerCustomized = async (
  _event: EventRecords,
  _context: Context
): Promise<void> => {
  idempotencyConfig.registerLambdaContext(_context);
  for (const record of _event.records) {
    const result = await processIdempotentlyCustomized(record);
    logger.info(result.toString());
  }

  return Promise.resolve();
};
