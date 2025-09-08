import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { DynamoDBMarshalled } from '@aws-lambda-powertools/parser/helpers/dynamodb';
import {
  DynamoDBStreamChangeRecordBase,
  DynamoDBStreamRecord,
} from '@aws-lambda-powertools/parser/schemas/dynamodb';
import type { DynamoDBStreamHandler } from 'aws-lambda';
import { z } from 'zod';

const customSchema = DynamoDBStreamRecord.extend({
  dynamodb: DynamoDBStreamChangeRecordBase.extend({
    NewImage: DynamoDBMarshalled(
      z.object({
        name: z.string(),
        age: z.number(),
      })
    ),
  }),
});

const processor = new BatchProcessor(EventType.DynamoDBStreams, {
  schema: customSchema,
});

const recordHandler = async ({
  dynamodb: {
    NewImage: { name, age },
  },
}: z.infer<typeof customSchema>) => {
  // this is safe to use because it's parsed
};

export const handler: DynamoDBStreamHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });
