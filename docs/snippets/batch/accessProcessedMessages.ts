import { BatchProcessor, EventType } from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type {
  SQSEvent,
  SQSRecord,
  Context,
  SQSBatchResponse,
} from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS);
const logger = new Logger();

const recordHandler = (record: SQSRecord): void => {
  const payload = record.body;
  if (payload) {
    const item = JSON.parse(payload);
    logger.info('Processed item', { item });
  }
};

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  const batch = event.Records;

  processor.register(batch, recordHandler, { context });
  const processedMessages = processor.process();

  for (const message of processedMessages) {
    const status: 'success' | 'fail' = message[0];
    const record = message[2];

    logger.info('Processed record', { status, record });
  }

  return processor.response();
};
