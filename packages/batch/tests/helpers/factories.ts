import type {
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';
import { randomInt, randomUUID } from 'node:crypto';

const sqsRecordFactory = (body: string, messageGroupId?: string): SQSRecord => {
  return {
    messageId: randomUUID(),
    receiptHandle: 'AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a',
    body: body,
    attributes: {
      ApproximateReceiveCount: '1',
      SentTimestamp: '1545082649183',
      SenderId: 'AIDAIENQZJOLO23YVJ4VO',
      ApproximateFirstReceiveTimestamp: '1545082649185',
      ...(messageGroupId ? { MessageGroupId: messageGroupId } : {}),
    },
    messageAttributes: {},
    md5OfBody: 'e4e68fb7bd0e697a0ae8f1bb342846b3',
    eventSource: 'aws:sqs',
    eventSourceARN: 'arn:aws:sqs:us-east-2:123456789012:my-queue',
    awsRegion: 'us-east-1',
  };
};

const kinesisRecordFactory = (body: string): KinesisStreamRecord => {
  let seq = '';
  for (let i = 0; i < 52; i++) {
    seq = seq + randomInt(10);
  }

  return {
    kinesis: {
      kinesisSchemaVersion: '1.0',
      partitionKey: '1',
      sequenceNumber: seq,
      data: body,
      approximateArrivalTimestamp: 1545084650.987,
    },
    eventSource: 'aws:kinesis',
    eventVersion: '1.0',
    eventID: 'shardId-000000000006:' + seq,
    eventName: 'aws:kinesis:record',
    invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-role',
    awsRegion: 'us-east-2',
    eventSourceARN:
      'arn:aws:kinesis:us-east-2:123456789012:stream/lambda-stream',
  };
};

const dynamodbRecordFactory = (body: string): DynamoDBRecord => {
  let seq = '';
  for (let i = 0; i < 10; i++) {
    seq = seq + randomInt(10);
  }

  return {
    eventID: '1',
    eventVersion: '1.0',
    dynamodb: {
      Keys: { Id: { N: '101' } },
      NewImage: { Message: { S: body } },
      StreamViewType: 'NEW_AND_OLD_IMAGES',
      SequenceNumber: seq,
      SizeBytes: 26,
    },
    awsRegion: 'us-west-2',
    eventName: 'INSERT',
    eventSourceARN: 'eventsource_arn',
    eventSource: 'aws:dynamodb',
  };
};

export { sqsRecordFactory, kinesisRecordFactory, dynamodbRecordFactory };
