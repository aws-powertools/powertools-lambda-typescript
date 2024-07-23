import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type { SQSHandler, SQSRecord } from 'aws-lambda';

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
    // biome-ignore format: we need the comment in the next line to stay there to annotate the code snippet in the docs
    throw new InvalidPayload('Payload does not contain minimum required fields'); // (1)!
  }
};

export const handler: SQSHandler = async (event, context) =>
  // biome-ignore format: we need the comment in the next line to stay there to annotate the code snippet in the docs
  processPartialResponse(event, recordHandler, processor, { // (2)!
    context,
  });
