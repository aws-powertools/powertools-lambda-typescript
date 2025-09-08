import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { JSONStringified } from '@aws-lambda-powertools/parser/helpers';
import { SqsRecordSchema } from '@aws-lambda-powertools/parser/schemas';
import type { SQSHandler } from 'aws-lambda';
import { z } from 'zod';

const customSchema = SqsRecordSchema.extend({
  body: JSONStringified(
    z.object({
      name: z.string(),
      age: z.number(),
    })
  ),
});

const processor = new BatchProcessor(EventType.SQS, { schema: customSchema });

const recordHandler = async ({
  body: { name, age },
}: z.infer<typeof customSchema>) => {
  // this is safe to use because it's parsed
};

export const handler: SQSHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });
