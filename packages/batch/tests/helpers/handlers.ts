import { DynamoDBRecord, KinesisStreamRecord, SQSRecord } from 'aws-lambda';

export const sqsRecordHandler = (record: SQSRecord): string => {
  const body = record.body;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

export const asyncSqsRecordHandler = async (
  record: SQSRecord
): Promise<string> => {
  const body = record.body;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

export const kinesisRecordHandler = (record: KinesisStreamRecord): string => {
  const body = record.kinesis.data;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

export const asyncKinesisRecordHandler = async (
  record: KinesisStreamRecord
): Promise<string> => {
  const body = record.kinesis.data;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

export const dynamodbRecordHandler = (record: DynamoDBRecord): object => {
  const body = record.dynamodb?.NewImage?.Message || { S: 'fail' };
  if (body['S']?.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

export const asyncDynamodbRecordHandler = async (
  record: DynamoDBRecord
): Promise<object> => {
  const body = (await record.dynamodb?.NewImage?.Message) || { S: 'fail' };
  if (body['S']?.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};
