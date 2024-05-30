import type {
  Context,
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';
import { SqsFifoPartialProcessor } from './SqsFifoPartialProcessor.js';
import { BasePartialBatchProcessor } from './BasePartialBatchProcessor.js';

/**
 * Options for batch processing
 *
 * @template T The type of the batch processor, defaults to BasePartialBatchProcessor
 * @property context The context object provided by the AWS Lambda runtime
 * @property skipGroupOnError The option to group on error during processing
 */
type BatchProcessingOptions<T = BasePartialBatchProcessor> = {
  /**
   * The context object provided by the AWS Lambda runtime. When provided,
   * it's made available to the handler function you specify
   */
  context: Context;
  /**
   * This option is only available for SqsFifoPartialProcessor.
   * If true skip the group on error during processing.
   */
  skipGroupOnError?: T extends SqsFifoPartialProcessor ? boolean : never;
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

export type {
  BatchProcessingOptions,
  BaseRecord,
  EventSourceDataClassTypes,
  SuccessResponse,
  FailureResponse,
  PartialItemFailures,
  PartialItemFailureResponse,
};
