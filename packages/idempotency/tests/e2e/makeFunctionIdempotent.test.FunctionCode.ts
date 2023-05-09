import { DynamoDBPersistenceLayer } from '../../src/persistence';
import { makeFunctionIdempotent } from '../../src/makeFunctionIdempotent';
import { Logger } from '@aws-lambda-powertools/logger';
import { Context } from 'aws-lambda';

const IDEMPOTENCY_TABLE_NAME = process.env.IDEMPOTENCY_TABLE_NAME;
const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
});

interface EventRecords {
  records: Record<string, unknown>[]
}

const logger = new Logger();

const processIdempotently = makeFunctionIdempotent(
  processRecord,
  {
    persistenceStore: dynamoDBPersistenceLayer,
    dataKeywordArgument: 'foo'
  });

function processRecord(record: Record<string, unknown>): string {
  logger.info(`Got test event: ${JSON.stringify(record)}`);

  return 'Processing done: ' + record['foo'];
}

export const handler = async (_event: EventRecords, _context: Context): Promise<void> => {
  for (const record of _event.records) {
    const result = await processIdempotently(record);
    logger.info(result.toString());

  }

  return Promise.resolve();
};

