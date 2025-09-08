import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  Context,
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';

import type { BasePartialBatchProcessor } from './BasePartialBatchProcessor.js';
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
 * Type representing the configuration options passed to the BasePartialBatchProcessor class.
 *
 * @property schema - The schema to be used for parsing
 */
type BasePartialBatchProcessorConfig = {
  /**
   * The schema be either of the following:
   * 1. An internal schema of the payload of the supported event types.
   * 2. An internal schema along with helper transformer functions.
   * 3. An extended schema of the supported event type.
   */
  schema: StandardSchemaV1;
};

export type {
  BatchProcessingOptions,
  BaseRecord,
  EventSourceDataClassTypes,
  SuccessResponse,
  FailureResponse,
  PartialItemFailures,
  PartialItemFailureResponse,
  BasePartialBatchProcessorConfig,
};
