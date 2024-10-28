/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { gunzipSync } from 'node:zlib';
import {
  KinesisDataStreamRecord,
  KinesisDataStreamSchema,
  KinesisFirehoseRecordSchema,
  KinesisFirehoseSchema,
  KinesisFirehoseSqsRecordSchema,
  KinesisFirehoseSqsSchema,
  SqsRecordSchema,
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
    const kinesisStreamEvent =
      TestEvents.kinesisStreamEvent as KinesisDataStreamEvent;
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
    const kinesisStreamEventOneRecord =
      TestEvents.kinesisStreamEventOneRecord as KinesisDataStreamEvent;
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
    const kinesisFirehoseKinesisEvent =
      TestEvents.kinesisFirehoseKinesisEvent as KinesisFireHoseEvent;
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
    const kinesisFirehosePutEvent =
      TestEvents.kinesisFirehosePutEvent as KinesisFireHoseEvent;
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
    const kinesisFirehoseSQSEvent =
      TestEvents.kinesisFirehoseSQSEvent as KinesisFireHoseSqsEvent;
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
      TestEvents.kinesisStreamCloudWatchLogsEvent as KinesisDataStreamEvent;
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
    const kinesisFirehoseSQSEvent = TestEvents.kinesisFirehoseSQSEvent as {
      records: { data: string }[];
    };
    kinesisFirehoseSQSEvent.records[0].data = 'not a valid json';
    const parsed = KinesisFirehoseSqsSchema.parse(kinesisFirehoseSQSEvent);

    expect(parsed).toStrictEqual(kinesisFirehoseSQSEvent);
  });
});
