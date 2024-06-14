import { BasePartialBatchProcessor } from './BasePartialBatchProcessor.js';
import { UnexpectedBatchTypeError } from './errors.js';
import type {
  BaseRecord,
  BatchProcessingOptions,
  PartialItemFailureResponse,
} from './types.js';

/**
 * Higher level function to process a batch of records synchronously
 * and handle partial failure cases.
 *
 * This function is intended to be used within synchronous Lambda handlers
 * and together with a batch processor that implements the {@link BasePartialBatchProcessor}
 * interface.
 *
 * It accepts a batch of records, a record handler function, a batch processor,
 * and an optional set of options to configure the batch processing.
 *
 * By default, the function will process the batch of records synchronously
 * and in sequence. If you need to process the records asynchronously, you can
 * use the {@link processPartialResponse} function instead.
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessor,
 *   EventType,
 *   processPartialResponseSync,
 * } from '@aws-lambda-powertools/batch';
 * import type { SQSRecord, SQSHandler } from 'aws-lambda';
 *
 * const processor = new BatchProcessor(EventType.SQS);
 *
 * const recordHandler = async (record: SQSRecord): Promise<void> => {
 *   const payload = JSON.parse(record.body);
 * };
 *
 * export const handler: SQSHandler = async (event, context) =>
 *   processPartialResponseSync(event, recordHandler, processor, {
 *     context,
 *   });
 * ```
 *
 * When working with SQS FIFO queues, we will stop processing at the first failure
 * and mark unprocessed messages as failed to preserve ordering. However, if you want to
 * continue processing messages from different group IDs, you can enable the `skipGroupOnError`
 * option for seamless processing of messages from various group IDs.
 *
 * @example
 * ```typescript
 * import {
 *   SqsFifoPartialProcessor,
 *   processPartialResponseSync,
 * } from '@aws-lambda-powertools/batch';
 * import type { SQSRecord, SQSHandler } from 'aws-lambda';
 *
 * const processor = new SqsFifoPartialProcessor();
 *
 * const recordHandler = async (record: SQSRecord): Promise<void> => {
 *   const payload = JSON.parse(record.body);
 * };
 *
 * export const handler: SQSHandler = async (event, context) =>
 *   processPartialResponseSync(event, recordHandler, processor, {
 *     context,
 *     skipGroupOnError: true
 *   });
 * ```
 *
 * @param event The event object containing the batch of records
 * @param recordHandler Sync function to process each record from the batch
 * @param processor Batch processor instance to handle the batch processing
 * @param options Batch processing options, which can vary with chosen batch processor implementation
 */
const processPartialResponseSync = <T extends BasePartialBatchProcessor>(
  event: { Records: BaseRecord[] },
  recordHandler: CallableFunction,
  processor: T,
  options?: BatchProcessingOptions<T>
): PartialItemFailureResponse => {
  if (!event.Records || !Array.isArray(event.Records)) {
    throw new UnexpectedBatchTypeError();
  }

  processor.register(event.Records, recordHandler, options);

  processor.processSync();

  return processor.response();
};

export { processPartialResponseSync };
