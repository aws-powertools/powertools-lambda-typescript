import {
  SqsFifoPartialProcessor,
  processPartialResponseSync,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type {
  SQSEvent,
  SQSRecord,
  Context,
  SQSBatchResponse,
} from 'aws-lambda';

const processor = new SqsFifoPartialProcessor();
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
  return processPartialResponseSync(event, recordHandler, processor, {
    context,
    skipGroupOnError: true,
  });
};
