/**
 * Constants for batch processor classes
 */
import { DynamoDBRecord, KinesisStreamRecord, SQSRecord } from 'aws-lambda';
import { BatchResponse, EventSourceDataClassTypes } from '.';

enum EventType {
  SQS = 'SQS',
  KinesisDataStreams = 'KinesisDataStreams',
  DynamoDBStreams = 'DynamoDBStreams',
}

const DEFAULT_RESPONSE: BatchResponse = {
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
