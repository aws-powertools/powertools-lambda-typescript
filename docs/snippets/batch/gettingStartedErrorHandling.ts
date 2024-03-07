import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type {
  SQSEvent,
  SQSRecord,
  Context,
  SQSBatchResponse,
} from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS);
const logger = new Logger();

class InvalidPayload extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'InvalidPayload';
  }
}

const recordHandler = async (record: SQSRecord): Promise<void> => {
  const payload = record.body;
  if (payload) {
    const item = JSON.parse(payload);
    logger.info('Processed item', { item });
  } else {
    // prettier-ignore
    throw new InvalidPayload('Payload does not contain minimum required fields'); // (1)!
  }
};

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  // prettier-ignore
  return processPartialResponse(event, recordHandler, processor, { // (2)!
    context,
  });
};
