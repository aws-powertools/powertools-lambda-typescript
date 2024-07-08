import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import type { SQSHandler, SQSRecord } from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS);

const recordHandler = async (_record: SQSRecord): Promise<void> => {
  // Process the record
};

export const handler: SQSHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
    throwOnFullBatchFailure: false,
  });
