import { describe, expect, it } from 'vitest';
import { DynamoDBStreamSchema } from '../../../src/schemas/dynamodb.js';
import type { DynamoDBStreamEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: DynamoDB', () => {
  const baseEvent = getTestEvent<DynamoDBStreamEvent>({
    eventsPath: 'dynamodb',
    filename: 'base',
  });

  const tumblingWindowEvent = getTestEvent<DynamoDBStreamEvent>({
    eventsPath: 'dynamodb',
    filename: 'tumbling-window',
  });

  it('parses a DynamoDB Stream event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = DynamoDBStreamSchema.parse(event);

    // Assess
    expect(result).toStrictEqual({
      Records: [
        {
          eventID: '1',
          eventVersion: '1.0',
          dynamodb: {
            ApproximateCreationDateTime: 1693997155.0,
            Keys: {
              Id: 101,
            },
            NewImage: {
              Message: 'New item!',
              Id: 101,
            },
            StreamViewType: 'NEW_IMAGE',
            SequenceNumber: '111',
            SizeBytes: 26,
          },
          awsRegion: 'us-west-2',
          eventName: 'INSERT',
          eventSourceARN: 'eventsource_arn',
          eventSource: 'aws:dynamodb',
        },
        {
          eventID: '2',
          eventVersion: '1.0',
          dynamodb: {
            OldImage: {
              Message: 'New item!',
              Id: 101,
            },
            SequenceNumber: '222',
            Keys: {
              Id: 101,
            },
            SizeBytes: 59,
            NewImage: {
              Message: 'This item has changed',
              Id: 101,
            },
            StreamViewType: 'NEW_AND_OLD_IMAGES',
          },
          awsRegion: 'us-west-2',
          eventName: 'MODIFY',
          eventSourceARN: 'source_arn',
          eventSource: 'aws:dynamodb',
        },
      ],
    });
  });

  it('throws if the event is not a DynamoDB Stream event', () => {
    // Prepare
    const event = {
      Records: [],
    };

    // Act & Assess
    expect(() => DynamoDBStreamSchema.parse(event)).toThrow();
  });

  it('throws if the Keys DynamoDB AttributeValues cannot be unmarshalled', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.Records[0].dynamodb.Keys = {
      Id: { L: 'invalid' },
    };

    // Act & Assess
    expect(() => DynamoDBStreamSchema.parse(event)).toThrow();
  });

  it('throws if the NewImage DynamoDB AttributeValues cannot be unmarshalled', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.Records[0].dynamodb.NewImage = {
      Message: { S: 'New item!' },
      Id: { L: 'invalid' },
    };

    // Act & Assess
    expect(() => DynamoDBStreamSchema.parse(event)).toThrow();
  });

  it('throws if the OldImage DynamoDB AttributeValues cannot be unmarshalled', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.Records[1].dynamodb.OldImage = {
      Message: { S: 'New item!' },
      Id: { L: 'invalid' },
    };

    // Act & Assess
    expect(() => DynamoDBStreamSchema.parse(event)).toThrow();
  });

  it('parses a DynamoDB Stream with tumbling window event', () => {
    // Prepare
    const event = structuredClone(tumblingWindowEvent);

    // Act
    const result = DynamoDBStreamSchema.parse(event);

    // Assess
    expect(result).toStrictEqual({
      Records: [
        {
          eventID: "1",
          eventName: "INSERT",
          eventVersion: "1.0",
          eventSource: "aws:dynamodb",
          awsRegion: "us-east-1",
          dynamodb: {
            Keys: {
              Id: 101
            },
            NewImage: {
              Message: "New item!",
              Id: 101,
            },
            SequenceNumber: "111",
            SizeBytes: 26,
            StreamViewType: "NEW_AND_OLD_IMAGES",
          },
          eventSourceARN: "stream-ARN",
        },
        {
          eventID: "2",
          eventName: "MODIFY",
          eventVersion: "1.0",
          eventSource: "aws:dynamodb",
          awsRegion: "us-east-1",
          dynamodb: {
            Keys: {
              Id: 101,
            },
            NewImage: {
              Message: "This item has changed",
              Id: 101,
            },
            OldImage: {
              Message: "New item!",
              Id: 101,
            },
            SequenceNumber: "222",
            SizeBytes: 59,
            StreamViewType: "NEW_AND_OLD_IMAGES",
          },
          eventSourceARN: "stream-ARN",
        },
        {
          eventID: "3",
          eventName: "REMOVE",
          eventVersion: "1.0",
          eventSource: "aws:dynamodb",
          awsRegion: "us-east-1",
          dynamodb: {
            Keys: {
              Id: 101,
            },
            OldImage: {
              Message: "This item has changed",
              Id: 101
            },
            SequenceNumber: "333",
            SizeBytes: 38,
            StreamViewType: "NEW_AND_OLD_IMAGES",
          },
          eventSourceARN: "stream-ARN",
        },
      ],
      window: {
        start: "2020-07-30T17:00:00Z",
        end: "2020-07-30T17:05:00Z",
      },
      state: {
        "1": "state1",
      },
      shardId: "shard123456789",
      eventSourceARN: "stream-ARN",
      isFinalInvokeForWindow: false,
      isWindowTerminatedEarly: false,
    });
  });
});
