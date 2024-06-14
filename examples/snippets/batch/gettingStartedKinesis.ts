import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type { KinesisStreamHandler, KinesisStreamRecord } from 'aws-lambda';

const processor = new BatchProcessor(EventType.KinesisDataStreams); // (1)!
const logger = new Logger();

const recordHandler = async (record: KinesisStreamRecord): Promise<void> => {
  logger.info('Processing record', { record: record.kinesis.data });
  const payload = JSON.parse(record.kinesis.data);
  logger.info('Processed item', { item: payload });
};

export const handler: KinesisStreamHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });
