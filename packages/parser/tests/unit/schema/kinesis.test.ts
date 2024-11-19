import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  KinesisDataStreamRecord,
  KinesisDataStreamSchema,
  KinesisFirehoseRecordSchema,
  KinesisFirehoseSchema,
  KinesisFirehoseSqsRecordSchema,
  KinesisFirehoseSqsSchema,
} from '../../../src/schemas/';
import { KinesisDynamoDBStreamSchema } from '../../../src/schemas/kinesis';
import type {
  KinesisDataStreamEvent,
  KinesisFireHoseEvent,
  KinesisFireHoseSqsEvent,
} from '../../../src/types';
import type {
  KinesisDynamoDBStreamEvent,
  KinesisFirehoseRecord,
  KinesisFirehoseSqsRecord,
} from '../../../src/types/schema';
import { getTestEvent } from './utils.js';

describe('Kinesis ', () => {
  const eventsPath = 'kinesis';
  it('should parse kinesis event', () => {
    const kinesisStreamEvent = getTestEvent<KinesisDataStreamEvent>({
      eventsPath,
      filename: 'stream',
    });
    const parsed = KinesisDataStreamSchema.parse(kinesisStreamEvent);

    const transformedInput = {
      Records: kinesisStreamEvent.Records.map((record, index) => {
        return {
          ...record,
          kinesis: {
            ...record.kinesis,
            data: Buffer.from(record.kinesis.data, 'base64').toString(),
          },
        };
      }),
    };

    expect(parsed).toStrictEqual(transformedInput);
  });
  it('should parse single kinesis record', () => {
    const kinesisStreamEventOneRecord = getTestEvent<KinesisDataStreamEvent>({
      eventsPath,
      filename: 'stream-one-record',
    });
    const parsed = KinesisDataStreamSchema.parse(kinesisStreamEventOneRecord);

    const transformedInput = {
      Records: kinesisStreamEventOneRecord.Records.map((record, index) => {
        return {
          ...record,
          kinesis: {
            ...record.kinesis,
            data: JSON.parse(
              Buffer.from(record.kinesis.data, 'base64').toString()
            ),
          },
        };
      }),
    };

    expect(parsed).toStrictEqual(transformedInput);
  });
  it('should parse Firehose event', () => {
    const kinesisFirehoseKinesisEvent = getTestEvent<KinesisFireHoseEvent>({
      eventsPath,
      filename: 'firehose',
    });
    const parsed = KinesisFirehoseSchema.parse(kinesisFirehoseKinesisEvent);

    const transformedInput = {
      ...kinesisFirehoseKinesisEvent,
      records: kinesisFirehoseKinesisEvent.records.map((record) => {
        return {
          ...record,
          data: Buffer.from(record.data, 'base64').toString(),
          kinesisRecordMetadata: record.kinesisRecordMetadata,
        };
      }),
    };
    expect(parsed).toStrictEqual(transformedInput);
  });
  it('should parse Kinesis Firehose PutEvents event', () => {
    const kinesisFirehosePutEvent = getTestEvent<KinesisFireHoseEvent>({
      eventsPath,
      filename: 'firehose-put',
    });

    const parsed = KinesisFirehoseSchema.parse(kinesisFirehosePutEvent);

    const transformedInput = {
      ...kinesisFirehosePutEvent,
      records: kinesisFirehosePutEvent.records.map((record) => {
        return {
          ...record,
          data: Buffer.from(record.data, 'base64').toString(),
        };
      }),
    };

    expect(parsed).toStrictEqual(transformedInput);
  });
  it('should parse Firehose event with SQS event', () => {
    const kinesisFirehoseSQSEvent = getTestEvent<KinesisFireHoseSqsEvent>({
      eventsPath,
      filename: 'firehose-sqs',
    });

    const parsed = KinesisFirehoseSqsSchema.parse(kinesisFirehoseSQSEvent);

    const transformedInput = {
      ...kinesisFirehoseSQSEvent,
      records: kinesisFirehoseSQSEvent.records.map((record) => {
        return {
          ...record,
          data: JSON.parse(
            Buffer.from(record.data as string, 'base64').toString()
          ),
        };
      }),
    };

    expect(parsed).toStrictEqual(transformedInput);
  });
  it('should parse Kinesis event with CloudWatch event', () => {
    const kinesisStreamCloudWatchLogsEvent =
      getTestEvent<KinesisDataStreamEvent>({
        eventsPath,
        filename: 'stream-cloudwatch-logs',
      });
    const parsed = KinesisDataStreamSchema.parse(
      kinesisStreamCloudWatchLogsEvent
    );

    const transformedInput = {
      Records: kinesisStreamCloudWatchLogsEvent.Records.map((record, index) => {
        return {
          ...record,
          kinesis: {
            ...record.kinesis,
            data: JSON.parse(
              gunzipSync(Buffer.from(record.kinesis.data, 'base64')).toString(
                'utf8'
              )
            ),
          },
        };
      }),
    };

    expect(parsed).toStrictEqual(transformedInput);
  });
  it('should return original value if cannot parse KinesisFirehoseSqsRecord', () => {
    const kinesisFirehoseSQSEvent = getTestEvent<KinesisFireHoseSqsEvent>({
      eventsPath,
      filename: 'firehose-sqs',
    });
    kinesisFirehoseSQSEvent.records[0].data = 'not a valid json';
    const parsed = KinesisFirehoseSqsSchema.parse(kinesisFirehoseSQSEvent);

    expect(parsed).toStrictEqual(kinesisFirehoseSQSEvent);
  });
  it('should parse a kinesis record from a kinesis event', () => {
    const kinesisStreamEvent: KinesisDataStreamEvent =
      getTestEvent<KinesisDataStreamEvent>({
        eventsPath,
        filename: 'stream-one-record',
      });
    const parsedRecord = KinesisDataStreamRecord.parse(
      kinesisStreamEvent.Records[0]
    );

    expect(parsedRecord.eventSource).toEqual('aws:kinesis');
    expect(parsedRecord.eventName).toEqual('aws:kinesis:record');
  });

  it('should parse a kinesis record from dynamodb stream event', () => {
    const dynamodbStreamKinesisEvent = getTestEvent<KinesisDynamoDBStreamEvent>(
      { eventsPath, filename: 'dynamodb-stream' }
    );
    const expectedRecords = [
      {
        awsRegion: 'eu-west-1',
        eventID: 'd9428029-0f63-4056-86da-ce10d545b1b9',
        eventName: 'INSERT',
        userIdentity: null,
        recordFormat: 'application/json',
        tableName: 'PowertoolsEventsStack-DynamoDBTable59784FC0-8NKAMTERTAXY',
        dynamodb: {
          ApproximateCreationDateTime: 1731924555370,
          Keys: { id: { S: 'record-1qit2y819gi' } },
          NewImage: {
            id: { S: 'record-1qit2y819gi' },
            data: { S: 'data-x6aq7ckdpgk' },
          },
          SizeBytes: 60,
        },
        eventSource: 'aws:dynamodb',
      },
      {
        awsRegion: 'eu-west-1',
        eventID: 'aa56cad4-311a-46c8-ab5f-c7a13a7a6298',
        eventName: 'INSERT',
        userIdentity: null,
        recordFormat: 'application/json',
        tableName: 'PowertoolsEventsStack-DynamoDBTable59784FC0-8NKAMTERTAXY',
        dynamodb: {
          ApproximateCreationDateTime: 1731924555370,
          Keys: { id: { S: 'record-fvxn3q4q5jw' } },
          NewImage: {
            id: { S: 'record-fvxn3q4q5jw' },
            data: { S: 'data-4eompjs89n5' },
          },
          SizeBytes: 60,
        },
        eventSource: 'aws:dynamodb',
      },
    ];

    const parsedRecord = KinesisDynamoDBStreamSchema.parse(
      dynamodbStreamKinesisEvent
    );

    expect(parsedRecord.Records.map((record) => record.kinesis.data)).toEqual(
      expectedRecords
    );
  });

  it('should parse a kinesis firehose record from a kinesis firehose event', () => {
    const kinesisFirehoseEvent: KinesisFireHoseEvent =
      getTestEvent<KinesisFireHoseEvent>({ eventsPath, filename: 'firehose' });
    const parsedRecord: KinesisFirehoseRecord =
      KinesisFirehoseRecordSchema.parse(kinesisFirehoseEvent.records[0]);

    expect(parsedRecord.data).toEqual('Hello World');
  });

  it('should parse a sqs record from a kinesis firehose event', () => {
    const kinesisFireHoseSqsEvent: KinesisFireHoseSqsEvent =
      getTestEvent<KinesisFireHoseSqsEvent>({
        eventsPath,
        filename: 'firehose-sqs',
      });
    const parsed: KinesisFirehoseSqsRecord =
      KinesisFirehoseSqsRecordSchema.parse(kinesisFireHoseSqsEvent.records[0]);

    expect(parsed.recordId).toEqual(
      '49640912821178817833517986466168945147170627572855734274000000'
    );
  });
});
