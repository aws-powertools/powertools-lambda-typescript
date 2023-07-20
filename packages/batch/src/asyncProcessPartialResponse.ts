import { BasePartialBatchProcessor } from './BasePartialBatchProcessor';
import type {
  EventSourceType,
  BatchProcessingOptions,
  PartialItemFailureResponse,
} from './types';

/**
 * Higher level function to handle batch event processing using an asynchronous handler.
 *
 * This function is used to process a batch of records and report partial failures from SQS, Kinesis Data Streams, and DynamoDB.
 * It returns a response object that can be used to report partial failures and avoid reprocessing the same records.
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessor,
 *   EventType,
 *   asyncProcessPartialResponse,
 * } from '@aws-lambda-powertools/batch';
 * import type {
 *   SQSEvent,
 *   SQSRecord,
 *   SQSBatchResponse,
 *   Context,
 * } from 'aws-lambda';
 *
 * const processor = new BatchProcessor(EventType.SQS);
 *
 * const recordHandler = async (_record: SQSRecord): Promise<void> => {
 *   // your record processing logic
 * };
 *
 * export const handler = async (
 *   event: SQSEvent,
 *   context: Context
 * ): Promise<SQSBatchResponse> => {
 *   return await asyncProcessPartialResponse(
 *     event,
 *     recordHandler,
 *     processor,
 *     { context },
 *   );
 * };
 * ```
 *
 * @param event Original event from AWS Lambda containing batch of records
 * @param recordHandler Asynchronous function to process each record in the batch
 * @param processor Batch processor instance to handle partial failure cases
 * @param options Optional batch processing options, such as context
 */
const asyncProcessPartialResponse = async (
  event: { Records: EventSourceType[] },
  recordHandler: CallableFunction,
  processor: BasePartialBatchProcessor,
  options?: BatchProcessingOptions
): Promise<PartialItemFailureResponse> => {
  processor.register(event.Records, recordHandler, options);

  await processor.asyncProcess();

  return processor.response();
};

export { asyncProcessPartialResponse };
