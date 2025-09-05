import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import type { KinesisStreamHandler, KinesisStreamRecord } from 'aws-lambda';
import { z } from 'zod';

const customSchema = z.object({
  name: z.string(),
  age: z.number(),
});

const processor = new BatchProcessor(EventType.KinesisDataStreams, {
  schema: customSchema,
});

const recordHandler = async ({
  kinesis: {
    data: { name, age },
  },
}: KinesisStreamRecord & {
  kinesis: { data: z.infer<typeof customSchema> };
}) => {
  // this is safe to use because it's parsed
};

export const handler: KinesisStreamHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });
