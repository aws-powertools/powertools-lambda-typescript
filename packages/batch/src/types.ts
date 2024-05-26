import type {
  Context,
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';
import { SqsFifoPartialProcessor } from './SqsFifoPartialProcessor';
import { BasePartialBatchProcessor } from './BasePartialBatchProcessor';

type BatchProcessingOptions<T = BasePartialBatchProcessor> = {
  context: Context;
  skipGroupOnError?: T extends SqsFifoPartialProcessor ? boolean : never;
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
