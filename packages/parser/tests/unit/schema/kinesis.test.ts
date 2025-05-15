import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  KinesisFirehoseRecordSchema,
  KinesisFirehoseSchema,
  KinesisFirehoseSqsRecordSchema,
  KinesisFirehoseSqsSchema,
} from '../../../src/schemas/kinesis-firehose.js';
import {
  KinesisDataStreamRecord,
  KinesisDataStreamSchema,
  KinesisDynamoDBStreamSchema,
} from '../../../src/schemas/kinesis.js';
import type {
  KinesisDataStreamEvent,
  KinesisDynamoDBStreamEvent,
  KinesisFireHoseEvent,
  KinesisFireHoseSqsEvent,
  KinesisFirehoseRecord,
  KinesisFirehoseSqsRecord,
} from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: Kinesis', () => {
  const eventsPath = 'kinesis';

  const kinesisStreamEvent = getTestEvent<KinesisDataStreamEvent>({
    eventsPath,
    filename: 'stream',
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

  const kinesisStreamTumblingWindowEvent = getTestEvent<KinesisDataStreamEvent>(
    {
      eventsPath,
      filename: 'stream-tumbling-window',
    }
  );

  it('parses kinesis event', () => {
    // Prepare
    const testEvent = structuredClone(kinesisStreamEvent);

    // Act
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

    // Assess
    expect(parsed).toStrictEqual(transformedInput);
  });

  it('parses Firehose event', () => {
    // Prepare
    const testEvent = structuredClone(kinesisFirehoseEvent);

    // Act
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

    // Assess
    expect(parsed).toStrictEqual(transformedInput);
  });

  it('parses Kinesis Firehose PutEvents event', () => {
    // Prepare
    const testEvent = structuredClone(kinesisFirehosePutEvent);

    // Act
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

    // Assess
    expect(parsed).toStrictEqual(transformedInput);
  });

  it('parses Firehose event with SQS event', () => {
    // Prepare
    const testEvent = structuredClone(kinesisFirehoseSQSEvent);

    // Act
    const parsed = KinesisFirehoseSqsSchema.parse(testEvent);

    const transformedInput = {
      ...testEvent,
      records: testEvent.records.map((record) => {
        return {
          ...record,
          data: JSON.parse(
            Buffer.from(record.data as unknown as string, 'base64').toString()
          ),
        };
      }),
    };

    // Assess
    expect(parsed).toStrictEqual(transformedInput);
  });

  it('parses Kinesis event with CloudWatch event', () => {
    // Prepare
    const testEvent = structuredClone(kinesisStreamCloudWatchLogsEvent);

    // Act
    const parsed = KinesisDataStreamSchema.parse(testEvent);

    const transformedInput = {
      Records: testEvent.Records.map((record) => {
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

    // Assess
    expect(parsed).toStrictEqual(transformedInput);
  });

  it('parses Kinesis event with tumbling window', () => {
    // Prepare
    const testEvent = structuredClone(kinesisStreamTumblingWindowEvent);


    // Act
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

    // Assess
    expect(parsed).toStrictEqual(transformedInput);
  });

  it('throws if cannot parse SQS record of KinesisFirehoseSqsRecord', () => {
    // Prepare
    const testEvent = getTestEvent<KinesisFireHoseSqsEvent>({
      eventsPath,
      filename: 'firehose-sqs-invalid',
    });

    // Act & Assess
    expect(() => KinesisFirehoseSqsSchema.parse(testEvent)).toThrow();
  });

  it('parses a kinesis record from a kinesis event', () => {
    // Prepare
    const testEvent: KinesisDataStreamEvent =
      structuredClone(kinesisStreamEvent);

    // Act
    const parsedRecord = KinesisDataStreamRecord.parse(testEvent.Records[0]);

    // Assess
    expect(parsedRecord.eventSource).toEqual('aws:kinesis');
    expect(parsedRecord.eventName).toEqual('aws:kinesis:record');
  });

  it('parses a kinesis record from dynamodb stream event', () => {
    // Prepare
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
          Keys: { id: 'record-1qit2y819gi' },
          NewImage: {
            id: 'record-1qit2y819gi',
            data: 'data-x6aq7ckdpgk',
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
          Keys: { id: 'record-fvxn3q4q5jw' },
          NewImage: {
            id: 'record-fvxn3q4q5jw',
            data: 'data-4eompjs89n5',
          },
          SizeBytes: 60,
        },
        eventSource: 'aws:dynamodb',
      },
    ];

    // Act
    const parsedRecord = KinesisDynamoDBStreamSchema.parse(testEvent);

    // Assess
    expect(parsedRecord.Records.map((record) => record.kinesis.data)).toEqual(
      expectedRecords
    );
  });

  it('parses a kinesis firehose record from a kinesis firehose event', () => {
    // Prepare
    const testEvent = structuredClone(kinesisFirehoseEvent);

    // Act
    const parsedRecord: KinesisFirehoseRecord =
      KinesisFirehoseRecordSchema.parse(testEvent.records[0]);

    // Assess
    expect(parsedRecord.data).toEqual('Hello World');
  });

  it('parses a sqs record from a kinesis firehose event', () => {
    // Prepare
    const kinesisFireHoseSqsEvent = structuredClone(kinesisFirehoseSQSEvent);

    // Act
    const parsed: KinesisFirehoseSqsRecord =
      KinesisFirehoseSqsRecordSchema.parse(kinesisFireHoseSqsEvent.records[0]);

    // Assess
    expect(parsed.recordId).toEqual(
      '49640912821178817833517986466168945147170627572855734274000000'
    );
  });
});
