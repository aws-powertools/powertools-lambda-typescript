import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type {
  DynamoDBStreamEvent,
  DynamoDBRecord,
  Context,
  DynamoDBBatchResponse,
} from 'aws-lambda';

const processor = new BatchProcessor(EventType.DynamoDBStreams); // (1)!
const logger = new Logger();

const recordHandler = async (record: DynamoDBRecord): Promise<void> => {
  if (record.dynamodb && record.dynamodb.NewImage) {
    logger.info('Processing record', { record: record.dynamodb.NewImage });
    const message = record.dynamodb.NewImage.Message.S;
    if (message) {
      const payload = JSON.parse(message);
      logger.info('Processed item', { item: payload });
    }
  }
};

export const handler = async (
  event: DynamoDBStreamEvent,
  context: Context
): Promise<DynamoDBBatchResponse> => {
  return processPartialResponse(event, recordHandler, processor, {
    context,
  });
};
