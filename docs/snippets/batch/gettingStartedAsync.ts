import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import axios from 'axios'; // axios is an external dependency
import type {
  SQSEvent,
  SQSRecord,
  Context,
  SQSBatchResponse,
} from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS);

const recordHandler = async (record: SQSRecord): Promise<number> => {
  const res = await axios.post('https://httpbin.org/anything', {
    message: record.body,
  });

  return res.status;
};

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  return await processPartialResponse(event, recordHandler, processor, {
    context,
  });
};
