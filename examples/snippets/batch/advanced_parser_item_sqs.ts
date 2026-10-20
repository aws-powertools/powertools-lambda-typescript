import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { parser } from '@aws-lambda-powertools/batch/parser';
import type { ParsedRecord } from '@aws-lambda-powertools/batch/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { SQSHandler, SQSRecord } from 'aws-lambda';
import { z } from 'zod';

const myItemSchema = z.object({
  name: z.string(),
  age: z.number(),
});

const logger = new Logger();
const processor = new BatchProcessor(EventType.SQS, {
  parser,
  innerSchema: myItemSchema,
  transformer: 'json',
  logger,
});

const recordHandler = async ({
  messageId,
  body: { name, age },
}: ParsedRecord<SQSRecord, z.infer<typeof myItemSchema>>) => {
  logger.info(`Processing record ${messageId}`, { name, age });
};

export const handler: SQSHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });
