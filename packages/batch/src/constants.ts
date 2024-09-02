import type {
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';
import type {
  EventSourceDataClassTypes,
  PartialItemFailureResponse,
} from './types.js';

/**
 * Enum of supported event types for the utility
 */
const EventType = {
  SQS: 'SQS',
  KinesisDataStreams: 'KinesisDataStreams',
  DynamoDBStreams: 'DynamoDBStreams',
} as const;

/**
 * Default response for the partial batch processor
 */
const DEFAULT_RESPONSE: PartialItemFailureResponse = {
  batchItemFailures: [],
};

/**
 * Mapping of event types to their respective data classes
 */
const DATA_CLASS_MAPPING = {
  [EventType.SQS]: (record: EventSourceDataClassTypes) => record as SQSRecord,
  [EventType.KinesisDataStreams]: (record: EventSourceDataClassTypes) =>
    record as KinesisStreamRecord,
  [EventType.DynamoDBStreams]: (record: EventSourceDataClassTypes) =>
    record as DynamoDBRecord,
};

export { EventType, DEFAULT_RESPONSE, DATA_CLASS_MAPPING };
