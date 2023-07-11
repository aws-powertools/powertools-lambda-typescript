/**
 * Types for batch processing utility
 */
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

type ItemIdentifier = { [key: string]: string };
type BatchResponse = { [key: string]: ItemIdentifier[] };

export type {
  BaseRecord,
  EventSourceDataClassTypes,
  ResultType,
  SuccessResponse,
  FailureResponse,
  ItemIdentifier,
  BatchResponse,
};
