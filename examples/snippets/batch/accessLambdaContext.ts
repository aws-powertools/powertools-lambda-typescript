import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type { SQSRecord, Context, SQSHandler } from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS);
const logger = new Logger();

const recordHandler = (record: SQSRecord, lambdaContext?: Context): void => {
  const payload = record.body;
  if (payload) {
    const item = JSON.parse(payload);
    logger.info('Processed item', { item });
  }
  if (lambdaContext) {
    logger.info('Remaining time', {
      time: lambdaContext.getRemainingTimeInMillis(),
    });
  }
};

export const handler: SQSHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });
