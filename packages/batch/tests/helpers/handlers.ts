import { DynamoDBRecord, KinesisStreamRecord, SQSRecord } from 'aws-lambda';
import { BatchProcessingOptions } from '../../src';

const sqsRecordHandler = (record: SQSRecord): string => {
  const body = record.body;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

const asyncSqsRecordHandler = async (record: SQSRecord): Promise<string> => {
  const body = record.body;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

const kinesisRecordHandler = (record: KinesisStreamRecord): string => {
  const body = record.kinesis.data;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

const asyncKinesisRecordHandler = async (
  record: KinesisStreamRecord
): Promise<string> => {
  const body = record.kinesis.data;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

const dynamodbRecordHandler = (record: DynamoDBRecord): object => {
  const body = record.dynamodb?.NewImage?.Message || { S: 'fail' };
  if (body['S']?.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

const asyncDynamodbRecordHandler = async (
  record: DynamoDBRecord
): Promise<object> => {
  const body = record.dynamodb?.NewImage?.Message || { S: 'fail' };
  if (body['S']?.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

const handlerWithContext = (
  record: SQSRecord,
  options: BatchProcessingOptions
): string => {
  const context = options.context;
  if (context.getRemainingTimeInMillis() == 0) {
    throw Error('No time remaining.');
  }

  return record.body;
};

export {
  sqsRecordHandler,
  asyncSqsRecordHandler,
  kinesisRecordHandler,
  asyncKinesisRecordHandler,
  dynamodbRecordHandler,
  asyncDynamodbRecordHandler,
  handlerWithContext,
};
