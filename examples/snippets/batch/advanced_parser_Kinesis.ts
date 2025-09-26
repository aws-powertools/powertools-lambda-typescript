import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { parser } from '@aws-lambda-powertools/batch/parser';
import type { ParsedRecord } from '@aws-lambda-powertools/batch/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { Base64Encoded } from '@aws-lambda-powertools/parser/helpers';
import {
  KinesisDataStreamRecord,
  KinesisDataStreamRecordPayload,
} from '@aws-lambda-powertools/parser/schemas/kinesis';
import type { KinesisDataStreamRecordEvent } from '@aws-lambda-powertools/parser/types';
import type { KinesisStreamHandler } from 'aws-lambda';
import { z } from 'zod';

const myItemSchema = Base64Encoded(
  z.object({
    name: z.string(),
    age: z.number(),
  })
);

const logger = new Logger();
const processor = new BatchProcessor(EventType.KinesisDataStreams, {
  parser,
  schema: KinesisDataStreamRecord.extend({
    kinesis: KinesisDataStreamRecordPayload.extend({
      data: myItemSchema,
    }),
  }),
  logger,
});

const recordHandler = async ({
  kinesis: {
    sequenceNumber,
    data: { name, age },
  },
}: ParsedRecord<
  KinesisDataStreamRecordEvent,
  z.infer<typeof myItemSchema>
>) => {
  logger.info(`Processing record: ${sequenceNumber}`, {
    name,
    age,
  });
};

export const handler: KinesisStreamHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });
