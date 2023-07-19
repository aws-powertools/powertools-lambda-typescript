import {
  Context,
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';

type BatchProcessingOptions = {
  context: Context;
};

type EventSourceDataClassTypes =
  | SQSRecord
  | KinesisStreamRecord
  | DynamoDBRecord;

type RecordValue = unknown;
type BaseRecord = { [key: string]: RecordValue } | EventSourceDataClassTypes;

type ResultType = unknown;
type SuccessResponse = ['success', ResultType, EventSourceDataClassTypes];

type FailureResponse = ['fail', string, EventSourceDataClassTypes];

type PartialItemFailures = { itemIdentifier: string };
type PartialItemFailureResponse = { batchItemFailures: PartialItemFailures[] };

export type {
  BatchProcessingOptions,
  BaseRecord,
  EventSourceDataClassTypes,
  ResultType,
  SuccessResponse,
  FailureResponse,
  PartialItemFailures,
  PartialItemFailureResponse,
};
