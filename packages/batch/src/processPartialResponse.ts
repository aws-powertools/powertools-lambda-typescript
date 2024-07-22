import type { BasePartialBatchProcessor } from './BasePartialBatchProcessor.js';
import { UnexpectedBatchTypeError } from './errors.js';
import type {
  BaseRecord,
  BatchProcessingOptions,
  PartialItemFailureResponse,
} from './types.js';

/**
 * Higher level function to process a batch of records asynchronously
 * and handle partial failure cases.
 *
 * This function is intended to be used within asynchronous Lambda handlers
 * and together with a batch processor that implements the {@link BasePartialBatchProcessor}
 * interface.
 *
 * It accepts a batch of records, a record handler function, a batch processor,
 * and an optional set of options to configure the batch processing.
 *
 * By default, the function will process the batch of records asynchronously
 * and in parallel. If you need to process the records synchronously, you can
 * use the {@link processPartialResponseSync} function instead.
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessor,
 *   EventType,
 *   processPartialResponse,
 * } from '@aws-lambda-powertools/batch';
 * import type { KinesisStreamHandler, KinesisStreamRecord } from 'aws-lambda';
 *
 * const processor = new BatchProcessor(EventType.KinesisDataStreams);
 *
 * const recordHandler = async (record: KinesisStreamRecord): Promise<void> => {
 *   const payload = JSON.parse(record.kinesis.data);
 * };
 *
 * export const handler: KinesisStreamHandler = async (event, context) =>
 *   processPartialResponse(event, recordHandler, processor, {
 *     context,
 *   });
 * ```
 *
 * By default, if the entire batch fails, the function will throw an error.
 * If you want to prevent this behavior, you can set the `throwOnFullBatchFailure` to `false`
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessor,
 *   EventType,
 *   processPartialResponse,
 * } from '@aws-lambda-powertools/batch';
 * import type { KinesisStreamHandler, KinesisStreamRecord } from 'aws-lambda';
 *
 * const processor = new BatchProcessor(EventType.KinesisDataStreams);
 *
 * const recordHandler = async (record: KinesisStreamRecord): Promise<void> => {
 *   const payload = JSON.parse(record.kinesis.data);
 * };
 *
 * export const handler: KinesisStreamHandler = async (event, context) =>
 *   processPartialResponse(event, recordHandler, processor, {
 *     context,
 *     throwOnFullBatchFailure: false
 *   });
 * ```
 *
 * @param event The event object containing the batch of records
 * @param recordHandler Async function to process each record from the batch
 * @param processor Batch processor instance to handle the batch processing
 * @param options Batch processing options
 */
const processPartialResponse = async (
  event: { Records: BaseRecord[] },
  recordHandler: CallableFunction,
  processor: BasePartialBatchProcessor,
  options?: BatchProcessingOptions
): Promise<PartialItemFailureResponse> => {
  if (!event.Records || !Array.isArray(event.Records)) {
    throw new UnexpectedBatchTypeError();
  }

  processor.register(event.Records, recordHandler, options);

  await processor.process();

  return processor.response();
};

export { processPartialResponse };
