import type {
  Context,
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';

/**
 * Options for batch processing
 *
 * @property context The context object provided by the AWS Lambda runtime
 */
type BatchProcessingOptions = {
  /**
   * The context object provided by the AWS Lambda runtime. When provided,
   * it's made available to the handler function you specify
   */
  context: Context;
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
