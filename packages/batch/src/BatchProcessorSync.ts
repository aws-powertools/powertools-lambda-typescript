import { BasePartialBatchProcessor } from './BasePartialBatchProcessor.js';
import { BatchProcessingError } from './errors.js';
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
 */
class BatchProcessorSync extends BasePartialBatchProcessor {
  /**
   * @throws {BatchProcessingError} This method is not implemented for asynchronous processing.
   *
   * @param _record The record to be processed
   */
  public async processRecord(
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
    try {
      const data = this.toBatchType(record, this.eventType);
      const result = this.handler(data, this.options?.context);

      return this.successHandler(record, result);
    } catch (error) {
      return this.failureHandler(record, error as Error);
    }
  }
}

export { BatchProcessorSync };
