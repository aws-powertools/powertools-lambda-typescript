import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import middy from '@middy/core';
import type {
  SQSEvent,
  SQSRecord,
  Context,
  SQSBatchResponse,
} from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS);
const tracer = new Tracer({ serviceName: 'serverlessAirline' });

const recordHandler = (record: SQSRecord): void => {
  const subsegment = tracer.getSegment()?.addNewSubsegment('### recordHandler'); // (1)!
  subsegment?.addAnnotation('messageId', record.messageId); // (2)!

  const payload = record.body;
  if (payload) {
    try {
      const item = JSON.parse(payload);
      // do something with the item
      subsegment?.addMetadata('item', item);
    } catch (error) {
      subsegment?.addError(error);
      throw error;
    }
  }

  subsegment?.close(); // (3)!
};

export const handler = middy(
  async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {
    return processPartialResponse(event, recordHandler, processor, {
      context,
    });
  }
).use(captureLambdaHandler(tracer));
