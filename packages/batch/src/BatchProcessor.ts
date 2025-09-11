import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { StreamRecord } from 'aws-lambda';
import { BasePartialBatchProcessor } from './BasePartialBatchProcessor.js';
import { EventType, SchemaVendor } from './constants.js';
import { BatchProcessingError } from './errors.js';
import type {
  BasePartialBatchProcessorParserConfig,
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
 * @param eventType - The type of event to process (SQS, Kinesis, DynamoDB)
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
   * @param record - The record to be processed
   */
  public async processRecord(
    record: BaseRecord
  ): Promise<SuccessResponse | FailureResponse> {
    try {
      const recordToProcess = await this.#parseRecord(record, this.eventType);
      const data = this.toBatchType(recordToProcess, this.eventType);
      const result = await this.handler(data, this.options?.context);
      return this.successHandler(record, result);
    } catch (error) {
      return this.failureHandler(record, error as Error);
    }
  }

  /**
   * @throws {BatchProcessingError} This method is not implemented for synchronous processing.
   *
   * @param _record - The record to be processed
   */
  public processRecordSync(
    _record: BaseRecord
  ): SuccessResponse | FailureResponse {
    throw new BatchProcessingError(
      'Not implemented. Use asyncProcess() instead.'
    );
  }

  /**
   * Extend the schema according to the event type passed.
   *
   * If useTransformers is true, extend using opinionated transformers.
   * Otherwise, extend without any transformers.
   *
   * @param eventType - The type of event to process (SQS, Kinesis, DynamoDB)
   * @param schema - The StandardSchema to be used for parsing
   * @param useTransformers - Whether to use transformers for parsing
   */
  async #createExtendedSchema(options: {
    eventType: keyof typeof EventType;
    innerSchema: StandardSchemaV1;
    transformer?: BasePartialBatchProcessorParserConfig['transformer'];
  }) {
    const { eventType, innerSchema, transformer } = options;
    let schema = innerSchema;
    switch (transformer) {
      case 'json': {
        const { JSONStringified } = await import(
          '@aws-lambda-powertools/parser/helpers'
        );
        schema = JSONStringified(innerSchema as any);
        break;
      }
      case 'base64': {
        const { Base64Encoded } = await import(
          '@aws-lambda-powertools/parser/helpers'
        );
        schema = Base64Encoded(innerSchema as any);
        break;
      }
      case 'unmarshall': {
        const { DynamoDBMarshalled } = await import(
          '@aws-lambda-powertools/parser/helpers/dynamodb'
        );
        schema = DynamoDBMarshalled(innerSchema as any);
        break;
      }
    }
    switch (eventType) {
      case EventType.SQS: {
        const { SqsRecordSchema } = await import(
          '@aws-lambda-powertools/parser/schemas/sqs'
        );
        return SqsRecordSchema.extend({
          body: schema,
        });
      }
      case EventType.KinesisDataStreams: {
        const { KinesisDataStreamRecord, KinesisDataStreamRecordPayload } =
          await import('@aws-lambda-powertools/parser/schemas/kinesis');
        return KinesisDataStreamRecord.extend({
          kinesis: KinesisDataStreamRecordPayload.extend({
            data: schema,
          }),
        });
      }
      case EventType.DynamoDBStreams: {
        const { DynamoDBStreamRecord, DynamoDBStreamChangeRecordBase } =
          await import('@aws-lambda-powertools/parser/schemas/dynamodb');
        return DynamoDBStreamRecord.extend({
          dynamodb: DynamoDBStreamChangeRecordBase.extend({
            OldImage: (schema as any).optional(),
            NewImage: (schema as any).optional(),
          }),
        });
      }
      default: {
        console.warn(
          `The event type provided is not supported. Supported events: ${Object.values(EventType).join(',')}`
        );
        throw new Error('Unsupported event type');
      }
    }
  }

  /**
   * Parse the record with the passed schema and
   * return the result or throw the error depending on parsing success
   *
   * @param record - The record to be parsed
   * @param schema - The modified schema to parse with
   */
  async #parseWithErrorHandling(
    record: EventSourceDataClassTypes,
    schema: StandardSchemaV1
  ) {
    const { parse } = await import('@aws-lambda-powertools/parser');
    const result = parse(record, undefined, schema, true);
    if (result.success) {
      return result.data as EventSourceDataClassTypes;
    }
    const issues = result.error.cause as ReadonlyArray<StandardSchemaV1.Issue>;
    const errorMessage = issues
      .map((issue) => `${issue?.path?.join('.')}: ${issue.message}`)
      .join('; ');
    this.logger.debug(errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * Parse the record according to the schema and event type passed.
   *
   * If the passed schema is already an extended schema,
   * use the schema directly to parse the record.
   *
   * Only Zod Schemas are supported for schema extension.
   *
   * @param record - The record to be parsed
   * @param eventType - The type of event to process
   */
  async #parseRecord(
    record: EventSourceDataClassTypes,
    eventType: keyof typeof EventType
  ): Promise<EventSourceDataClassTypes> {
    if (this.parserConfig == null) {
      return record;
    }
    const { schema, innerSchema, transformer } = this.parserConfig;
    // If the external schema is specified, use it to parse the record
    if (schema != null) {
      return this.#parseWithErrorHandling(record, schema);
    }
    if (innerSchema != null) {
      // Only proceed with schema extension if it's a Zod schema
      if (innerSchema['~standard'].vendor !== SchemaVendor.Zod) {
        this.logger.error(
          'The schema provided is not supported. Only Zod schemas are supported for extension.'
        );
        throw new Error('Unsupported schema type');
      }
      if (transformer != null) {
        const schemaWithTransformers = await this.#createExtendedSchema({
          eventType,
          innerSchema,
          transformer,
        });
        return this.#parseWithErrorHandling(record, schemaWithTransformers);
      }
      const schemaWithoutTransformers = await this.#createExtendedSchema({
        eventType,
        innerSchema,
      });
      return this.#parseWithErrorHandling(record, schemaWithoutTransformers);
    }
    this.logger.error(
      'The schema provided is not supported. Only Zod schemas are supported for extension.'
    );
    throw new Error('Either schema or innerSchema is required for parsing');
  }
}

export { BatchProcessor };
