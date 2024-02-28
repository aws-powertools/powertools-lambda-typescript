import type {
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';
import type {
  PartialItemFailureResponse,
  EventSourceDataClassTypes,
} from './types.js';

const EventType = {
  SQS: 'SQS',
  KinesisDataStreams: 'KinesisDataStreams',
  DynamoDBStreams: 'DynamoDBStreams',
} as const;

const DEFAULT_RESPONSE: PartialItemFailureResponse = {
  batchItemFailures: [],
};

const DATA_CLASS_MAPPING = {
  [EventType.SQS]: (record: EventSourceDataClassTypes) => record as SQSRecord,
  [EventType.KinesisDataStreams]: (record: EventSourceDataClassTypes) =>
    record as KinesisStreamRecord,
  [EventType.DynamoDBStreams]: (record: EventSourceDataClassTypes) =>
    record as DynamoDBRecord,
};

export { EventType, DEFAULT_RESPONSE, DATA_CLASS_MAPPING };
