import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { parser } from '@aws-lambda-powertools/batch/parser';
import type { ParsedRecord } from '@aws-lambda-powertools/batch/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { SQSHandler, SQSRecord } from 'aws-lambda';
import { z } from 'zod/mini';

const logger = new Logger({ serviceName: 'sqsStandardBatchProcessor' });
const innerSchema = z.object({ message: z.string(), shouldFail: z.boolean() });
const processor = new BatchProcessor(EventType.SQS, {
  logger,
  parser,
  innerSchema,
  transformer: 'json',
});

const recordHandler = ({
  body: { shouldFail },
}: ParsedRecord<SQSRecord, z.infer<typeof innerSchema>>): void => {
  if (shouldFail) {
    throw new Error('Simulated processing failure');
  }
};

export const handler: SQSHandler = async (event, context) => {
  logger.addContext(context);
  logger.info('messages', {
    messageCount: event.Records.length,
    messagesWillFail: event.Records.filter((r) => {
      const parsed = JSON.parse(r.body);
      return parsed.shouldFail === true || parsed.shouldFail === undefined;
    }).map((r) => r.messageId),
    messagesWillSucceed: event.Records.filter(
      (r) => JSON.parse(r.body).shouldFail === false
    ).map((r) => r.messageId),
  });
  const response = await processPartialResponse(
    event,
    recordHandler,
    processor,
    { context, throwOnFullBatchFailure: false }
  );
  logger.info('response', {
    batchItemFailures: response.batchItemFailures,
  });

  return response;
};
