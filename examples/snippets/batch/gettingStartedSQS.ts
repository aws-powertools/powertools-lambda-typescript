import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type { SQSRecord, SQSHandler } from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS); // (1)!
const logger = new Logger();

// prettier-ignore
const recordHandler = async (record: SQSRecord): Promise<void> => { // (2)!
  const payload = record.body;
  if (payload) {
    const item = JSON.parse(payload);
    logger.info('Processed item', { item });
  }
};

export const handler: SQSHandler = async (event, context) =>
  // prettier-ignore
  processPartialResponse(event, recordHandler, processor, { // (3)!
    context,
  });

export { processor };
