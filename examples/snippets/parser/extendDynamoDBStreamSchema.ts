import { DynamoDBMarshalled } from '@aws-lambda-powertools/parser/helpers/dynamodb';
import {
  DynamoDBStreamChangeRecordBase,
  DynamoDBStreamRecord,
  DynamoDBStreamSchema,
} from '@aws-lambda-powertools/parser/schemas/dynamodb';
import { z } from 'zod';

const customSchema = z.object({
  id: z.string(),
  message: z.string(),
});

const extendedSchema = DynamoDBStreamSchema.extend({
  Records: z.array(
    DynamoDBStreamRecord.extend({
      dynamodb: DynamoDBStreamChangeRecordBase.extend({
        NewImage: DynamoDBMarshalled(customSchema).optional(),
      }),
    })
  ),
});

type ExtendedDynamoDBStreamEvent = z.infer<typeof extendedSchema>;
