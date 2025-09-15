import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  Context,
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
  StreamRecord,
} from 'aws-lambda';
import type { ZodType } from 'zod';
import type { BasePartialBatchProcessor } from './BasePartialBatchProcessor.js';
import type { BatchProcessor } from './BatchProcessor.js';
import type { parser } from './parser.js';
import type { SqsFifoPartialProcessor } from './SqsFifoPartialProcessor.js';
import type { SqsFifoPartialProcessorAsync } from './SqsFifoPartialProcessorAsync.js';

/**
 * Options for batch processing
 *
 * @template T The type of the batch processor, defaults to BasePartialBatchProcessor
 * @property context The context object provided by the AWS Lambda runtime
 * @property skipGroupOnError The option to group on error during processing
 * @property throwOnFullBatchFailure The option to throw an error if the entire batch fails
 * @property processInParallel Indicates whether the records should be processed in parallel
 */
type BatchProcessingOptions<T = BasePartialBatchProcessor> = {
  /**
   * The context object provided by the AWS Lambda runtime. When provided,
   * it's made available to the handler function you specify
   */
  context?: Context;
  /**
   * This option is only available for SqsFifoPartialProcessor & SqsFifoPartialProcessorAsync.
   * If true skip the group on error during processing.
   */
  skipGroupOnError?: T extends
    | SqsFifoPartialProcessor
    | SqsFifoPartialProcessorAsync
    ? boolean
    : never;
  /**
   *  Set this to false to prevent throwing an error if the entire batch fails.
   */
  throwOnFullBatchFailure?: boolean;
  /**
   * Indicates whether the records should be processed in parallel.
   * When set to `true`, the records will be processed in parallel using `Promise.all`.
   * When set to `false`, the records will be processed sequentially.
   */
  processInParallel?: T extends
    | SqsFifoPartialProcessor
    | SqsFifoPartialProcessorAsync
    ? never
    : boolean;
};

/**
 * The types of data that can be provided by an event source
 */
type EventSourceDataClassTypes =
  | SQSRecord
  | KinesisStreamRecord
  | DynamoDBRecord;

/**
 * Type representing a record from an event source
 */
type BaseRecord = { [key: string]: unknown } | EventSourceDataClassTypes;

/**
 * Type representing a successful response
 *
 * The first element is the string literal 'success',
 * the second element is the result of the handler function,
 * and the third element is the type of data provided by the event source
 */
type SuccessResponse = ['success', unknown, EventSourceDataClassTypes];

/**
 * Type representing a failure response
 *
 * The first element is the string literal 'fail',
 * the second element is the error message,
 * and the third element is the type of data provided by the event source
 */
type FailureResponse = ['fail', string, EventSourceDataClassTypes];

/**
 * Type representing a partial failure response
 */
type PartialItemFailures = { itemIdentifier: string };

/**
 * Type representing a partial failure response
 */
type PartialItemFailureResponse = { batchItemFailures: PartialItemFailures[] };

/**
 * Configuration options for {@link BatchProcessor | `BatchProcessor`} parser integration.
 *
 * When enabling parser integration, you must provide {@link parser} along with either `schema` or `innerSchema`.
 * Import `parser` from `@aws-lambda-powertools/batch/parser`.
 *
 * When using `schema`, provide a complete schema for the record that matches the event type. For example,
 * when using `EventType.SQS` you need a schema for an SQS Record. If using Zod, you can extend one of the
 * built-in schemas to easily get the appropriate schema.
 *
 * When using `innerSchema`, we use the `EventType` to determine the base schema, so you only provide
 * a schema for the payload. You can optionally pass a `transformer` to transform the payload before parsing.
 * For example, use the `json` transformer for JSON stringified objects.
 *
 * You can optionally pass a `logger` for debug and warning messages.
 *
 * Note: `innerSchema` supports only Zod schemas, while `schema` supports any Standard Schema-compatible parsing library.
 *
 * @property parser - Required when using schema parsing (import from `@aws-lambda-powertools/batch/parser`)
 * @property schema - Complete event schema (mutually exclusive with innerSchema)
 * @property innerSchema - Payload-only schema (mutually exclusive with schema)
 * @property transformer - Payload transformer (only available with innerSchema)
 * @property logger - Optional logger for debug/warning messages
 */
type BasePartialBatchProcessorParserConfig =
  | {
      /**
       * Required when using schema parsing - import from `@aws-lambda-powertools/batch/parser`
       */
      parser: typeof parser;
      /**
       * Complete event schema using Standard Schema specification, mutually exclusive with `innerSchema`
       */
      schema: StandardSchemaV1;
      innerSchema?: never;
      transformer?: never;
      /**
       * Optional logger for debug and warning messages
       */
      logger?: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;
    }
  | {
      /**
       * Required when using schema parsing - import from `@aws-lambda-powertools/batch/parser`
       */
      parser: typeof parser;
      schema?: never;
      /**
       * Payload-only Zod schema, mutually exclusive with `schema`
       */
      innerSchema: ZodType;
      /**
       * Payload transformer, only available with `innerSchema`
       */
      transformer?: 'json' | 'base64' | 'unmarshall';
      /**
       * Optional logger for debug and warning messages
       */
      logger?: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;
    }
  | {
      parser?: never;
      schema?: never;
      innerSchema?: never;
      transformer?: never;
      /**
       * Optional logger for debug and warning messages
       */
      logger?: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;
    };

/**
 * Utility type for creating typed record handlers with custom payload schemas.
 *
 * @template TRecord - The base record type, one of: `SqsRecord`, `KinesisStreamRecord`, and `DynamoDBRecord`
 * @template TPayload - The inferred type from your payload schema
 * @template TOldPayload - Optional separate type for DynamoDB `OldImage`, when not specified both `NewImage` and `OldImage` will have the same type
 *
 * **SQS Records**
 *
 * @example
 * ```typescript
 * const mySchema = z.object({ name: z.string(), age: z.number() });
 * type MySqsRecord = ParsedRecord<SqsRecord, z.infer<typeof mySchema>>;
 *
 * const sqsHandler = async (record: MySqsRecord) => {
 *   // record.body is now typed as { name: string, age: number }
 * };
 * ```
 *
 * **Kinesis Records**
 *
 * @example
 * ```typescript
 * const kinesisSchema = z.object({ userId: z.string(), action: z.string() });
 * type MyKinesisRecord = ParsedRecord<KinesisStreamRecord, z.infer<typeof kinesisSchema>>;
 *
 * const kinesisHandler = async (record: MyKinesisRecord) => {
 *   // record.kinesis.data is now typed as { userId: string, action: string }
 * };
 * ```
 *
 * **DynamoDB Records - Single Schema**
 *
 * @example
 * ```typescript
 * const dynamoSchema = z.object({ id: z.string(), status: z.string() });
 * type MyDynamoRecord = ParsedRecord<DynamoDBRecord, z.infer<typeof dynamoSchema>>;
 *
 * const dynamoHandler = async (record: MyDynamoRecord) => {
 *   // record.dynamodb.NewImage and record.dynamodb.OldImage are both typed as { id: string, status: string }
 * };
 * ```
 *
 * @example
 * **DynamoDB Records - Separate Schemas**
 * ```typescript
 * const newSchema = z.object({ id: z.string(), status: z.string(), updatedAt: z.string() });
 * const oldSchema = z.object({ id: z.string(), status: z.string() });
 * type MyDynamoRecordSeparate = ParsedRecord<DynamoDBRecord, z.infer<typeof newSchema>, z.infer<typeof oldSchema>>;
 *
 * const dynamoHandlerSeparate = async (record: MyDynamoRecordSeparate) => {
 *   // record.dynamodb.NewImage is typed as { id: string, status: string, updatedAt: string }
 *   // record.dynamodb.OldImage is typed as { id: string, status: string }
 * };
 * ```
 */
type ParsedRecord<TRecord, TPayload, TOldPayload = TPayload> = TRecord extends {
  body: string;
}
  ? Omit<TRecord, 'body'> & { body: TPayload }
  : TRecord extends { kinesis: { data: string } }
    ? Omit<TRecord, 'kinesis'> & {
        kinesis: Omit<TRecord['kinesis'], 'data'> & { data: TPayload };
      }
    : TRecord extends { dynamodb?: StreamRecord }
      ? Omit<TRecord, 'dynamodb'> & {
          dynamodb: Omit<StreamRecord, 'NewImage' | 'OldImage'> & {
            NewImage: TPayload;
            OldImage: TOldPayload;
          };
        }
      : TRecord;

export type {
  BatchProcessingOptions,
  BaseRecord,
  EventSourceDataClassTypes,
  SuccessResponse,
  FailureResponse,
  PartialItemFailures,
  PartialItemFailureResponse,
  BasePartialBatchProcessorParserConfig,
  ParsedRecord,
};
