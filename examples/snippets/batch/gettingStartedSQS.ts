import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type { SQSHandler, SQSRecord } from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS); // (1)!
const logger = new Logger();

// biome-ignore format:
const recordHandler = async (record: SQSRecord): Promise<void> => { // (2)!
  const payload = record.body;
  if (payload) {
    const item = JSON.parse(payload);
    logger.info('Processed item', { item });
  }
};

export const handler: SQSHandler = async (event, context) =>
  // biome-ignore format:
  processPartialResponse(event, recordHandler, processor, { // (3)!
    context,
  });

export { processor };
