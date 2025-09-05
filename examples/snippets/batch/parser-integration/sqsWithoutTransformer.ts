import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import type { SQSHandler, SQSRecord } from 'aws-lambda';
import { z } from 'zod';

const customSchema = z.object({
  name: z.string(),
  age: z.number(),
});

const processor = new BatchProcessor(EventType.SQS, { schema: customSchema });

const recordHandler = async ({
  body: { name, age },
}: SQSRecord & { body: z.infer<typeof customSchema> }) => {
  // this is safe to use because it's parsed
};

export const handler: SQSHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });
