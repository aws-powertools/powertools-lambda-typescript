import { BatchProcessor, EventType } from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type { SQSRecord, SQSHandler } from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS);
const logger = new Logger();

const recordHandler = (record: SQSRecord): void => {
  const payload = record.body;
  if (payload) {
    const item = JSON.parse(payload);
    logger.info('Processed item', { item });
  }
};

export const handler: SQSHandler = async (event, context) => {
  const batch = event.Records; // (1)!

  processor.register(batch, recordHandler, { context }); // (2)!
  const processedMessages = await processor.process();

  for (const message of processedMessages) {
    const status: 'success' | 'fail' = message[0];
    const error = message[1];
    const record = message[2];

    logger.info('Processed record', { status, record, error });
  }

  return processor.response();
};
