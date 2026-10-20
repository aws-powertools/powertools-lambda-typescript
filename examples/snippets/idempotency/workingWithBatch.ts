import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type {
  Context,
  SQSBatchResponse,
  SQSEvent,
  SQSRecord,
} from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS);

const dynamoDBPersistence = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTable',
});
const idempotencyConfig = new IdempotencyConfig({
  eventKeyJmesPath: 'messageId',
});

const processIdempotently = makeIdempotent(
  async (_record: SQSRecord) => {
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
  idempotencyConfig.registerLambdaContext(context);

  return processPartialResponse(event, processIdempotently, processor, {
    context,
  });
};
