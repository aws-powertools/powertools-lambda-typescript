import { DynamoDBRecord, KinesisStreamRecord, SQSRecord } from 'aws-lambda';

// types from base.py
type EventSourceDataClassTypes =
  | SQSRecord
  | KinesisStreamRecord
  | DynamoDBRecord;

type RecordValue = unknown;
type BaseRecord = { [key: string]: RecordValue } | EventSourceDataClassTypes;

type ResultType = unknown;
type SuccessResponse = [string, ResultType, EventSourceDataClassTypes];

type FailureResponse = [string, string, EventSourceDataClassTypes];

export type {
  BaseRecord,
  EventSourceDataClassTypes,
  ResultType,
  SuccessResponse,
  FailureResponse,
};
