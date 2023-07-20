import type { PartialItemFailureResponse } from './types';

/**
 * Event types supported by the Batch Processing utility.
 *
 * @example
 * ```typescript
 * import { BatchProcessor, EventType } from '@aws-lambda-powertools/batch';
 *
 * const sqsProcessor = new BatchProcessor(EventType.SQS);
 * const kinesisProcessor = new BatchProcessor(EventType.KinesisDataStreams);
 * const dynamoDBStreamProcessor = new BatchProcessor(EventType.DynamoDBStreams);
 * ```
 */
const EventType = {
  SQS: 'SQS',
  KinesisDataStreams: 'KinesisDataStreams',
  DynamoDBStreams: 'DynamoDBStreams',
} as const;

/**
 * @internal
 *
 * Result types supported by the Batch Processing utility.
 */
const ResultType = {
  Success: 'success',
  Failure: 'fail',
} as const;

/**
 * @internal
 *
 * Default response for batch processing failures.
 */
const DEFAULT_RESPONSE: PartialItemFailureResponse = {
  batchItemFailures: [],
};

export { EventType, ResultType, DEFAULT_RESPONSE };
