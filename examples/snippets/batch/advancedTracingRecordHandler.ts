import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import type { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS);
const tracer = new Tracer({ serviceName: 'serverlessAirline' });

const recordHandler = async (record: SQSRecord): Promise<void> => {
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

export const handler: SQSHandler = middy(async (event: SQSEvent, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  })
).use(captureLambdaHandler(tracer));
