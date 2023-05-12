import { DynamoDBPersistenceLayer } from '../../src/persistence';
import { makeFunctionIdempotent } from '../../src/makeFunctionIdempotent';
import { Logger } from '@aws-lambda-powertools/logger';
import { Context } from 'aws-lambda';

const IDEMPOTENCY_TABLE_NAME = process.env.IDEMPOTENCY_TABLE_NAME || 'table_name';
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
  records: Record<string, unknown>[]
}

const logger = new Logger();

const processRecord = (record: Record<string, unknown>): string => {
  logger.info(`Got test event: ${JSON.stringify(record)}`);

  return 'Processing done: ' + record['foo'];
};

const processIdempotently = makeFunctionIdempotent(
  processRecord,
  {
    persistenceStore: dynamoDBPersistenceLayer,
    dataKeywordArgument: 'foo'
  });

export const handler = async (_event: EventRecords, _context: Context): Promise<void> => {
  for (const record of _event.records) {
    const result = await processIdempotently(record);
    logger.info(result.toString());

  }

  return Promise.resolve();
};

const processIdempotentlyCustomized = makeFunctionIdempotent(
  processRecord,
  {
    persistenceStore: ddbPersistenceLayerCustomized,
    dataKeywordArgument: 'foo'
  });

export const handlerCustomized = async (_event: EventRecords, _context: Context): Promise<void> => {
  for (const record of _event.records) {
    const result = await processIdempotentlyCustomized(record);
    logger.info(result.toString());

  }

  return Promise.resolve();
};

