import type {
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';
import { randomInt, randomUUID } from 'node:crypto';

/**
 * Factory function for creating SQS records.
 *
 * Used for testing purposes.
 *
 * @param body The body of the record.
 */
const sqsRecordFactory = (body: string): SQSRecord => {
  return {
    messageId: randomUUID(),
    receiptHandle: 'AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a',
    body: body,
    attributes: {
      ApproximateReceiveCount: '1',
      SentTimestamp: '1545082649183',
      SenderId: 'AIDAIENQZJOLO23YVJ4VO',
      ApproximateFirstReceiveTimestamp: '1545082649185',
    },
    messageAttributes: {},
    md5OfBody: 'e4e68fb7bd0e697a0ae8f1bb342846b3',
    eventSource: 'aws:sqs',
    eventSourceARN: 'arn:aws:sqs:us-east-2:123456789012:my-queue',
    awsRegion: 'us-east-1',
  };
};

/**
 * Factory function for creating Kinesis records.
 *
 * Used for testing purposes.
 *
 * @param body The body of the record.
 */
const kinesisRecordFactory = (body: string): KinesisStreamRecord => {
  let sequenceNumber = '';
  for (let i = 0; i < 52; i++) {
    sequenceNumber = sequenceNumber + randomInt(10);
  }

  return {
    kinesis: {
      kinesisSchemaVersion: '1.0',
      partitionKey: '1',
      sequenceNumber,
      data: body,
      approximateArrivalTimestamp: 1545084650.987,
    },
    eventSource: 'aws:kinesis',
    eventVersion: '1.0',
    eventID: 'shardId-000000000006:' + sequenceNumber,
    eventName: 'aws:kinesis:record',
    invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-role',
    awsRegion: 'us-east-2',
    eventSourceARN:
      'arn:aws:kinesis:us-east-2:123456789012:stream/lambda-stream',
  };
};

/**
 * Factory function for creating DynamoDB Stream records.
 *
 * Used for testing purposes.
 *
 * @param body The body of the record.
 */
const dynamodbRecordFactory = (body: string): DynamoDBRecord => {
  let sequenceNumber = '';
  for (let i = 0; i < 10; i++) {
    sequenceNumber = sequenceNumber + randomInt(10);
  }

  return {
    eventID: '1',
    eventVersion: '1.0',
    dynamodb: {
      Keys: { Id: { N: '101' } },
      NewImage: { Message: { S: body } },
      StreamViewType: 'NEW_AND_OLD_IMAGES',
      SequenceNumber: sequenceNumber,
      SizeBytes: 26,
    },
    awsRegion: 'us-west-2',
    eventName: 'INSERT',
    eventSourceARN: 'eventsource_arn',
    eventSource: 'aws:dynamodb',
  };
};

export { sqsRecordFactory, kinesisRecordFactory, dynamodbRecordFactory };
