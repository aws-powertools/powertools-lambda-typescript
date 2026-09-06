import { BasePartialBatchProcessor } from './BasePartialBatchProcessor.js';
import { BatchProcessingError, toError } from './errors.js';
import type { BaseRecord, FailureResponse, SuccessResponse } from './types.js';

/**
 * Process records in a batch synchronously and handle partial failure cases.
 *
 * The batch processor supports processing records coming from Amazon SQS,
 * Amazon Kinesis Data Streams, and Amazon DynamoDB Streams.
 *
 * Items are processed synchronously and in sequence.
 *
 * **Process batch triggered by SQS**
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessorSync,
 *   EventType,
 *   processPartialResponseSync,
 * } from '@aws-lambda-powertools/batch';
 * import type { SQSRecord, SQSHandler } from 'aws-lambda';
 *
 * const processor = new BatchProcessorSync(EventType.SQS);
 *
 * const recordHandler = (record: SQSRecord): void => {
 *   const payload = JSON.parse(record.body);
 * };
 *
 * export const handler: SQSHandler = async (event, context) =>
 *   processPartialResponseSync(event, recordHandler, processor, {
 *     context,
 *   });
 * ```
 *
 * **Process batch triggered by Kinesis Data Streams*
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessorSync,
 *   EventType,
 *   processPartialResponseSync,
 * } from '@aws-lambda-powertools/batch';
 * import type { KinesisStreamHandler, KinesisStreamRecord } from 'aws-lambda';
 *
 * const processor = new BatchProcessorSync(EventType.KinesisDataStreams);
 *
 * const recordHandler = (record: KinesisStreamRecord): void => {
 *   const payload = JSON.parse(record.kinesis.data);
 * };
 *
 * export const handler: KinesisStreamHandler = async (event, context) =>
 *   processPartialResponseSync(event, recordHandler, processor, {
 *     context,
 *   });
 * ```
 *
 * **Process batch triggered by DynamoDB Streams**
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessorSync,
 *   EventType,
 *   processPartialResponseSync,
 * } from '@aws-lambda-powertools/batch';
 * import type { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';
 *
 * const processor = new BatchProcessorSync(EventType.DynamoDBStreams);
 *
 * const recordHandler = (record: DynamoDBRecord): void => {
 *   const payload = record.dynamodb.NewImage.Message.S;
 * };
 *
 * export const handler: DynamoDBStreamHandler = async (event, context) =>
 *   processPartialResponseSync(event, recordHandler, processor, {
 *     context,
 * });
 * ```
 *
 * @param eventType The type of event to process (SQS, Kinesis, DynamoDB)
 * @deprecated Use {@link BasePartialBatchProcessor} instead, this class is deprecated and will be removed in the next major version.
 */
/* v8 ignore next -- @preserve */ class BatchProcessorSync extends BasePartialBatchProcessor {
  /**
   * @throws {BatchProcessingError} This method is not implemented for asynchronous processing.
   *
   * @param _record The record to be processed
   */
  /* v8 ignore next -- @preserve */ public processRecord(
    _record: BaseRecord
  ): Promise<SuccessResponse | FailureResponse> {
    throw new BatchProcessingError('Not implemented. Use process() instead.');
  }

  /**
   * Handle a record synchronously with the instance handler provided.
   *
   * This method implements the abstract method from the parent class,
   * and orchestrates the processing of a single record.
   *
   * First, it converts the record to the appropriate type for the batch processor.
   * Then, it calls the handler function with the record data and context.
   *
   * If the handler function completes successfully, the method returns a success response.
   * Otherwise, it returns a failure response with the error that occurred during processing.
   *
   * @param record The record to be processed
   */
  public processRecordSync(
    record: BaseRecord
  ): SuccessResponse | FailureResponse {
    let result: unknown;
    try {
      const data = this.toBatchType(record, this.eventType);
      result = this.handler(data, this.options?.context);
    } catch (error) {
      return this.failureHandler(record, toError(error));
    }

    if (isThenable(result)) {
      throw new BatchProcessingError(
        'The record handler returned a promise, but this batch processor is synchronous and cannot await it. Use `BatchProcessor` together with `processPartialResponse()`, or `SqsFifoPartialProcessorAsync` for FIFO queues.'
      );
    }

    return this.successHandler(record, result);
  }
}

/**
 * Type guard to detect a thenable (promise-like) value returned by a record handler.
 *
 * @param value - The value returned by the record handler
 */
const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown> | undefined)?.then === 'function';

export { BatchProcessorSync };
