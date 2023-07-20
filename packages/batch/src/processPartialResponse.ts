import { BasePartialBatchProcessor } from './BasePartialBatchProcessor';
import type {
  EventSourceType,
  BatchProcessingOptions,
  PartialItemFailureResponse,
} from './types';

/**
 * Higher level function to handle batch event processing using a synchronous handler.
 *
 * This function is used to process a batch of records and report partial failures from SQS, Kinesis Data Streams, and DynamoDB.
 * It returns a response object that can be used to report partial failures and avoid reprocessing the same records.
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessor,
 *   EventType,
 *   processPartialResponse,
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
 * const recordHandler = (_record: SQSRecord): void => {
 *   // your record processing logic
 * };
 *
 * export const handler = async (
 *   event: SQSEvent,
 *   context: Context
 * ): Promise<SQSBatchResponse> => {
 *   return processPartialResponse(event, recordHandler, processor, { context });
 * };
 * ```
 *
 * @param event Original event from AWS Lambda containing batch of records
 * @param recordHandler Synchronous function to process each record in the batch
 * @param processor Batch processor instance to handle partial failure cases
 * @param options Optional batch processing options, such as context
 */
const processPartialResponse = (
  event: { Records: EventSourceType[] },
  recordHandler: CallableFunction,
  processor: BasePartialBatchProcessor,
  options?: BatchProcessingOptions
): PartialItemFailureResponse => {
  processor.register(event.Records, recordHandler, options);

  processor.process();

  return processor.response();
};

export { processPartialResponse };
