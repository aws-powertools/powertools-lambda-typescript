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

  const kinesisStreamEvent = getTestEvent<KinesisDataStreamEvent>({
    eventsPath,
    filename: 'stream',
  });

  const kinesisStreamEventOneRecord = getTestEvent<KinesisDataStreamEvent>({
    eventsPath,
    filename: 'stream-one-record',
  });

  const kinesisFirehoseEvent = getTestEvent<KinesisFireHoseEvent>({
    eventsPath,
    filename: 'firehose',
  });

  const kinesisFirehosePutEvent = getTestEvent<KinesisFireHoseEvent>({
    eventsPath,
    filename: 'firehose-put',
  });

  const kinesisFirehoseSQSEvent = getTestEvent<KinesisFireHoseSqsEvent>({
    eventsPath,
    filename: 'firehose-sqs',
  });

  const kinesisStreamCloudWatchLogsEvent = getTestEvent<KinesisDataStreamEvent>(
    {
      eventsPath,
      filename: 'stream-cloudwatch-logs',
    }
  );

  it('should parse kinesis event', () => {
    const testEvent = structuredClone(kinesisStreamEvent);
    const parsed = KinesisDataStreamSchema.parse(testEvent);

    const transformedInput = {
      Records: testEvent.Records.map((record, index) => {
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
    const testEvent = structuredClone(kinesisStreamEventOneRecord);
    const parsed = KinesisDataStreamSchema.parse(testEvent);

    const transformedInput = {
      Records: testEvent.Records.map((record, index) => {
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
    const testEvent = structuredClone(kinesisFirehoseEvent);
    const parsed = KinesisFirehoseSchema.parse(testEvent);

    const transformedInput = {
      ...testEvent,
      records: testEvent.records.map((record) => {
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
    const testEvent = structuredClone(kinesisFirehosePutEvent);

    const parsed = KinesisFirehoseSchema.parse(testEvent);

    const transformedInput = {
      ...testEvent,
      records: testEvent.records.map((record) => {
        return {
          ...record,
          data: Buffer.from(record.data, 'base64').toString(),
        };
      }),
    };

    expect(parsed).toStrictEqual(transformedInput);
  });
  it('should parse Firehose event with SQS event', () => {
    const testEvent = structuredClone(kinesisFirehoseSQSEvent);

    const parsed = KinesisFirehoseSqsSchema.parse(testEvent);

    const transformedInput = {
      ...testEvent,
      records: testEvent.records.map((record) => {
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
    const testEvent = structuredClone(kinesisStreamCloudWatchLogsEvent);

    const parsed = KinesisDataStreamSchema.parse(testEvent);

    const transformedInput = {
      Records: testEvent.Records.map((record, index) => {
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
    const testEvent = structuredClone(kinesisFirehoseSQSEvent);
    testEvent.records[0].data = 'not a valid json';

    const parsed = KinesisFirehoseSqsSchema.parse(testEvent);

    expect(parsed).toStrictEqual(testEvent);
  });
  it('should parse a kinesis record from a kinesis event', () => {
    const testEvent: KinesisDataStreamEvent =
      structuredClone(kinesisStreamEvent);

    const parsedRecord = KinesisDataStreamRecord.parse(testEvent.Records[0]);

    expect(parsedRecord.eventSource).toEqual('aws:kinesis');
    expect(parsedRecord.eventName).toEqual('aws:kinesis:record');
  });

  it('should parse a kinesis record from dynamodb stream event', () => {
    const testEvent = getTestEvent<KinesisDynamoDBStreamEvent>({
      eventsPath,
      filename: 'dynamodb-stream',
    });
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

    const parsedRecord = KinesisDynamoDBStreamSchema.parse(testEvent);

    expect(parsedRecord.Records.map((record) => record.kinesis.data)).toEqual(
      expectedRecords
    );
  });

  it('should parse a kinesis firehose record from a kinesis firehose event', () => {
    const testEvent = structuredClone(kinesisFirehoseEvent);
    const parsedRecord: KinesisFirehoseRecord =
      KinesisFirehoseRecordSchema.parse(testEvent.records[0]);

    expect(parsedRecord.data).toEqual('Hello World');
  });

  it('should parse a sqs record from a kinesis firehose event', () => {
    const kinesisFireHoseSqsEvent = structuredClone(kinesisFirehoseSQSEvent);
    const parsed: KinesisFirehoseSqsRecord =
      KinesisFirehoseSqsRecordSchema.parse(kinesisFireHoseSqsEvent.records[0]);

    expect(parsed.recordId).toEqual(
      '49640912821178817833517986466168945147170627572855734274000000'
    );
  });
});
