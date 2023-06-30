import { DynamoDBRecord, KinesisStreamRecord, SQSRecord } from 'aws-lambda';

// types from base.py
type RecordValue = unknown;
type BaseRecord = { [key: string]: RecordValue };

type SQSRecordType = BaseRecord & SQSRecord;
type KinesisStreamRecordType = BaseRecord & KinesisStreamRecord;
type DynamoDBRecordType = BaseRecord & DynamoDBRecord;

type EventSourceDataClassTypes =
  | SQSRecordType
  | KinesisStreamRecordType
  | DynamoDBRecordType;

type ResultType = unknown;
type SuccessResponse = [string, ResultType, EventSourceDataClassTypes];

type FailureResponse = [string, string, EventSourceDataClassTypes];

export type {
  RecordValue,
  BaseRecord,
  SQSRecordType,
  KinesisStreamRecordType,
  DynamoDBRecordType,
  EventSourceDataClassTypes,
  ResultType,
  SuccessResponse,
  FailureResponse,
};
