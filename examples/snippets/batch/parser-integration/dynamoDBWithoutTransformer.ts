import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import type { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';
import { z } from 'zod';

const customSchema = z.object({
  name: z.string(),
  age: z.number(),
});

const processor = new BatchProcessor(EventType.DynamoDBStreams, {
  innerSchema: customSchema,
  transformer: 'unmarshall',
});

const recordHandler = async ({
  dynamodb: {
    NewImage: { name, age },
  },
}: DynamoDBRecord & {
  dynamodb: { NewImage: z.infer<typeof customSchema> };
}) => {
  // this is safe to use because it's parsed
};

export const handler: DynamoDBStreamHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });
