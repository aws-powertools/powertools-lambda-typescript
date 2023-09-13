import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';

import { Logger } from '@aws-lambda-powertools/logger';
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/lib/persistence/DynamoDBPersistenceLayer';
import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';

const logger = new Logger();

const processor = new BatchProcessor(EventType.SQS);

const dynamoDBPersistence = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTable',
});
const idempotencyConfig = new IdempotencyConfig({
  eventKeyJmesPath: 'messageId',
});

const processIdempotently = makeIdempotent(
  async (record: SQSRecord) => {
    logger.info('Processing event', { record });
    // process your event
  },
  {
    persistenceStore: dynamoDBPersistence,
    config: idempotencyConfig,
  }
);

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  return processPartialResponse(event, processIdempotently, processor, {
    context,
  });
};
