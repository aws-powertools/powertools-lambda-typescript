import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { parser } from '@aws-lambda-powertools/batch/parser';
import type { ParsedRecord } from '@aws-lambda-powertools/batch/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { JSONStringified } from '@aws-lambda-powertools/parser/helpers';
import { SqsRecordSchema } from '@aws-lambda-powertools/parser/schemas';
import type { SqsRecord } from '@aws-lambda-powertools/parser/types';
import type { SQSHandler } from 'aws-lambda';
import { z } from 'zod';

const myItemSchema = JSONStringified(
  z.object({ name: z.string(), age: z.number() })
);

const logger = new Logger();
const processor = new BatchProcessor(EventType.SQS, {
  parser,
  schema: SqsRecordSchema.extend({
    body: myItemSchema,
  }),
  logger,
});

const recordHandler = async ({
  messageId,
  body: { name, age },
}: ParsedRecord<SqsRecord, z.infer<typeof myItemSchema>>) => {
  logger.info(`Processing record ${messageId}`, { name, age });
};

export const handler: SQSHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });
