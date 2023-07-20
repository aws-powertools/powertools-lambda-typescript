import type {
  Context,
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';
import { ResultType } from './constants';

/**
 * Additional options for batch processing.
 *
 * Useful for passing the AWS Lambda context object to the handler.
 */
type BatchProcessingOptions = {
  /**
   * The AWS Lambda context object.
   * @see https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
   */
  context: Context;
};

/**
 * The type of event that triggered the Lambda function.
 * @example 'SQSRecord', 'DynamoDBRecord', 'KinesisStreamRecord'
 */
type EventSourceType = SQSRecord | KinesisStreamRecord | DynamoDBRecord;

/**
 * Successful response from processing a record in a batch.
 *
 * It contains the result of the handler and the original record.
 */
type SuccessResponse = readonly ['success', unknown, EventSourceType];
/**
 * Failed response from processing a record in a batch.
 *
 * It contains the error message and the original record.
 */
type FailureResponse = readonly ['fail', string, EventSourceType];

/**
 * Type that identifies a partial failure response.
 */
type PartialItemFailures = { itemIdentifier: string };
/**
 * Response object to be used in reporting partial failures.
 */
type PartialItemFailureResponse = { batchItemFailures: PartialItemFailures[] };

export type {
  BatchProcessingOptions,
  EventSourceType,
  ResultType,
  SuccessResponse,
  FailureResponse,
  PartialItemFailures,
  PartialItemFailureResponse,
};
