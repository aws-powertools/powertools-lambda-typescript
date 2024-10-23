import { describe, expect, it } from 'vitest';
import { KinesisDataStreamSchema } from '../../../src/schemas/kinesis.js';
import type { KinesisDataStreamEvent } from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: Kinesis Stream', () => {
  const baseEvent = getTestEvent<KinesisDataStreamEvent>({
    eventsPath: 'kinesis-stream',
    filename: 'base',
  });

  it('parses a Kinesis event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const parsedEvent = KinesisDataStreamSchema.parse(event);

    // Assess
    expect(parsedEvent.Records[0].kinesis.data).toEqual(
      'Hello, this is a test.'
    );
    expect(parsedEvent.Records[1].kinesis.data).toEqual('This is only a test.');
  });

  it('parses a Kinesis event of a CloudWatch log', () => {
    // Prepare
    const event = getTestEvent<KinesisDataStreamEvent>({
      eventsPath: 'kinesis-stream',
      filename: 'cloudwatch-event-via-stream',
    });

    // Act
    const parsedEvent = KinesisDataStreamSchema.parse(event);

    // Assess
    expect(parsedEvent.Records).toHaveLength(2);
    const expectedObject = expect.objectContaining({
      logEvents: expect.any(Array),
      logGroup: expect.stringContaining('/aws/lambda/'),
      logStream: expect.stringContaining('2022/11/10/[$LATEST]'),
      messageType: 'DATA_MESSAGE',
      owner: '231436140809',
      subscriptionFilters: expect.any(Array),
    });
    expect(parsedEvent.Records[0].kinesis.data).toStrictEqual(expectedObject);
    expect(parsedEvent.Records[1].kinesis.data).toStrictEqual(expectedObject);
  });

  it('throws if event is not a Kinesis Stream event', () => {
    // Prepare
    const event = { foo: 'bar' };

    // Act & Assess
    expect(() => KinesisDataStreamSchema.parse(event)).toThrow();
  });
});
