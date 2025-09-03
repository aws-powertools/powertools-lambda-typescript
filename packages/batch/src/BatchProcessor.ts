import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';
import { BasePartialBatchProcessor } from './BasePartialBatchProcessor.js';
import { EventType } from './constants.js';
import { BatchProcessingError } from './errors.js';
import type {
  BaseRecord,
  EventSourceDataClassTypes,
  FailureResponse,
  SuccessResponse,
} from './types.js';

/**
 * Process records in a batch asynchronously and handle partial failure cases.
 *
 * The batch processor supports processing records coming from Amazon SQS,
 * Amazon Kinesis Data Streams, and Amazon DynamoDB Streams.
 *
 * Items are processed asynchronously and in parallel.
 *
 * **Process batch triggered by SQS**
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessor,
 *   EventType,
 *   processPartialResponse,
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
 *   processPartialResponse(event, recordHandler, processor, {
 *     context,
 *   });
 * ```
 *
 * **Process batch triggered by Kinesis Data Streams*
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
 * **Process batch triggered by DynamoDB Streams**
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessor,
 *   EventType,
 *   processPartialResponse,
 * } from '@aws-lambda-powertools/batch';
 * import type { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';
 *
 * const processor = new BatchProcessor(EventType.DynamoDBStreams);
 *
 * const recordHandler = async (record: DynamoDBRecord): Promise<void> => {
 *   const payload = record.dynamodb.NewImage.Message.S;
 * };
 *
 * export const handler: DynamoDBStreamHandler = async (event, context) =>
 *   processPartialResponse(event, recordHandler, processor, {
 *     context,
 * });
 * ```
 *
 * @param eventType The type of event to process (SQS, Kinesis, DynamoDB)
 */
class BatchProcessor extends BasePartialBatchProcessor {
  /**
   * Handle a record asynchronously with the instance handler provided.
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
  public async processRecord(
    record: BaseRecord
  ): Promise<SuccessResponse | FailureResponse> {
    try {
      const parsedRecord = await this.parseRecord(
        record,
        this.eventType,
        this.schema
      );
      const data = this.toBatchType(parsedRecord, this.eventType);
      const result = await this.handler(data, this.options?.context);

      return this.successHandler(record, result);
    } catch (error) {
      return this.failureHandler(record, error as Error);
    }
  }

  /**
   * @throws {BatchProcessingError} This method is not implemented for synchronous processing.
   *
   * @param _record The record to be processed
   */
  public processRecordSync(
    _record: BaseRecord
  ): SuccessResponse | FailureResponse {
    throw new BatchProcessingError(
      'Not implemented. Use asyncProcess() instead.'
    );
  }

  /**
   * Parse the record according to the schema passed.
   *
   * If the schema is not provided, it returns the record as is.
   *
   * @param record The record to be parsed
   * @param eventType The type of event to process
   * @param schema The StandardSchema to be used for parsing
   */
  public async parseRecord(
    record: EventSourceDataClassTypes,
    eventType: keyof typeof EventType,
    schema?: StandardSchemaV1
  ): Promise<SQSRecord | KinesisStreamRecord | DynamoDBRecord> {
    if (schema) {
      const { parse } = await import('@aws-lambda-powertools/parser');
      if (eventType === EventType.SQS) {
        try {
          return parse(record, undefined, schema) as SQSRecord;
        } catch (error) {
          const { JSONStringified } = await import(
            '@aws-lambda-powertools/parser/helpers'
          );
          const { SqsRecordSchema } = await import(
            '@aws-lambda-powertools/parser/schemas/sqs'
          );
          const extendedSchema = SqsRecordSchema.extend({
            // biome-ignore lint/suspicious/noExplicitAny: at least for now, we need to broaden the type because the JSONstringified helper method is not typed with StandardSchemaV1 but with ZodSchema
            body: JSONStringified(schema as any),
          });
          return parse(record, undefined, extendedSchema);
        }
      }
      throw new Error('Unsupported event type');
    }
    return record;
  }
}

export { BatchProcessor };
