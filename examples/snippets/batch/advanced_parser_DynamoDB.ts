import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { parser } from '@aws-lambda-powertools/batch/parser';
import type { ParsedRecord } from '@aws-lambda-powertools/batch/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBMarshalled } from '@aws-lambda-powertools/parser/helpers/dynamodb';
import {
  DynamoDBStreamChangeRecordBase,
  DynamoDBStreamRecord,
} from '@aws-lambda-powertools/parser/schemas/dynamodb';
import type { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';
import { z } from 'zod';

const myItemSchema = DynamoDBMarshalled(
  z.object({ name: z.string(), age: z.number() })
);

const logger = new Logger();
const processor = new BatchProcessor(EventType.SQS, {
  parser,
  schema: DynamoDBStreamRecord.extend({
    dynamodb: DynamoDBStreamChangeRecordBase.extend({
      NewImage: myItemSchema,
    }),
  }),
  logger,
});

const recordHandler = async ({
  eventID,
  dynamodb: {
    NewImage: { name, age },
  },
}: ParsedRecord<DynamoDBRecord, z.infer<typeof myItemSchema>>) => {
  logger.info(`Processing record ${eventID}`, { name, age });
};

export const handler: DynamoDBStreamHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });
