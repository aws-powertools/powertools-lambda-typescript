/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import {
  KinesisDataStreamRecord,
  KinesisDataStreamSchema,
  KinesisFirehoseRecordSchema,
  KinesisFirehoseSchema,
  KinesisFirehoseSqsRecordSchema,
  KinesisFirehoseSqsSchema,
} from '../../../src/schemas/';
import type {
  KinesisDataStreamEvent,
  KinesisFireHoseEvent,
  KinesisFireHoseSqsEvent,
} from '../../../src/types';
import type {
  KinesisFirehoseRecord,
  KinesisFirehoseSqsRecord,
} from '../../../src/types/schema';
import { TestEvents } from './utils.js';

describe('Kinesis ', () => {
  it('should parse kinesis event', () => {
    const kinesisStreamEvent = TestEvents.kinesisStreamEvent;
    const parsed = KinesisDataStreamSchema.parse(kinesisStreamEvent);

    expect(parsed.Records[0].kinesis.data).toEqual('Hello, this is a test.');
  });
  it('should parse single kinesis record', () => {
    const kinesisStreamEventOneRecord = TestEvents.kinesisStreamEventOneRecord;
    const parsed = KinesisDataStreamSchema.parse(kinesisStreamEventOneRecord);

    expect(parsed.Records[0].kinesis.data).toEqual({
      message: 'test message',
      username: 'test',
    });
  });
  it('should parse Firehose event', () => {
    const kinesisFirehoseKinesisEvent = TestEvents.kinesisFirehoseKinesisEvent;
    const parsed = KinesisFirehoseSchema.parse(kinesisFirehoseKinesisEvent);
    expect(parsed.records[0].data).toEqual('Hello World');
  });
  it('should parse Kinesis Firehose PutEvents event', () => {
    const kinesisFirehosePutEvent = TestEvents.kinesisFirehosePutEvent;
    const parsed = KinesisFirehoseSchema.parse(kinesisFirehosePutEvent);
    expect(JSON.parse(parsed.records[1].data)).toEqual({
      Hello: 'World',
    });
  });
  it('should parse Firehose event with SQS event', () => {
    const kinesisFirehoseSQSEvent = TestEvents.kinesisFirehoseSQSEvent;
    const parsed = KinesisFirehoseSqsSchema.parse(kinesisFirehoseSQSEvent);
    expect(parsed.records[0].data).toMatchObject({
      messageId: '5ab807d4-5644-4c55-97a3-47396635ac74',
      body: 'Test message.',
    });
  });
  it('should parse Kinesis event with CloudWatch event', () => {
    const kinesisStreamCloudWatchLogsEvent =
      TestEvents.kinesisStreamCloudWatchLogsEvent;
    const parsed = KinesisDataStreamSchema.parse(
      kinesisStreamCloudWatchLogsEvent
    );

    expect(parsed.Records[0].kinesis.data).toMatchObject({
      messageType: 'DATA_MESSAGE',
      owner: '231436140809',
      logGroup: '/aws/lambda/pt-1488-DummyLogDataFunction-gnWXPvL6jJyG',
      logStream: '2022/11/10/[$LATEST]26b6a45d574f442ea28438923cbf7bf7',
    });
  });
  it('should return original value if cannot parse KinesisFirehoseSqsRecord', () => {
    const kinesisFirehoseSQSEvent = TestEvents.kinesisFirehoseSQSEvent as {
      records: { data: string }[];
    };
    kinesisFirehoseSQSEvent.records[0].data = 'not a valid json';
    const parsed = KinesisFirehoseSqsSchema.parse(kinesisFirehoseSQSEvent);
    expect(parsed.records[0].data).toEqual('not a valid json');
  });
  it('should parse a kinesis record from a kinesis event', () => {
    const kinesisStreamEvent: KinesisDataStreamEvent =
      TestEvents.kinesisStreamEvent as KinesisDataStreamEvent;
    const parsedRecord = KinesisDataStreamRecord.parse(
      kinesisStreamEvent.Records[0]
    );

    expect(parsedRecord.eventName).toEqual('aws:kinesis:record');
  });

  it('should parse a kinesis firehose record from a kinesis firehose event', () => {
    const kinesisFirehoseEvent: KinesisFireHoseEvent =
      TestEvents.kinesisFirehoseKinesisEvent as KinesisFireHoseEvent;
    const parsedRecord: KinesisFirehoseRecord =
      KinesisFirehoseRecordSchema.parse(kinesisFirehoseEvent.records[0]);

    expect(parsedRecord.data).toEqual('Hello World');
  });

  it('should parse a sqs record from a kinesis firehose event', () => {
    const kinesisFireHoseSqsEvent: KinesisFireHoseSqsEvent =
      TestEvents.kinesisFirehoseSQSEvent as KinesisFireHoseSqsEvent;
    const parsed: KinesisFirehoseSqsRecord =
      KinesisFirehoseSqsRecordSchema.parse(kinesisFireHoseSqsEvent.records[0]);

    expect(parsed.recordId).toEqual(
      '49640912821178817833517986466168945147170627572855734274000000'
    );
  });
});
