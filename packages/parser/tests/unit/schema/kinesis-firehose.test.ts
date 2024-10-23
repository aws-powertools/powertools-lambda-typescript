import { describe, expect, it } from 'vitest';
import {
  KinesisFirehoseSchema,
  KinesisFirehoseSqsSchema,
} from '../../../src/schemas/kinesis-firehose.js';
import type { KinesisFireHoseEvent } from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: Kinesis Firehose', () => {
  const putEvent = getTestEvent<KinesisFireHoseEvent>({
    eventsPath: 'kinesis-firehose',
    filename: 'direct-put',
  });
  const dataStreamEvent = getTestEvent({
    eventsPath: 'kinesis-firehose',
    filename: 'from-data-stream',
  });
  const sqsEvent = getTestEvent<KinesisFireHoseEvent>({
    eventsPath: 'kinesis-firehose',
    filename: 'sqs-event-via-kinesis-firehose',
  });

  it.each([
    { event: putEvent, name: 'Direct Put' },
    { event: dataStreamEvent, name: 'From Data Stream' },
  ])('parses a Kinesis event ($name)', ({ event }) => {
    // Act
    const parsedEvent = KinesisFirehoseSchema.parse(event);

    // Assess
    expect(parsedEvent.records).toHaveLength(2);
    expect(parsedEvent.records[0].data).toEqual('Hello World');
    expect(parsedEvent.records[1].data).toEqual(
      JSON.stringify({ Hello: 'World' })
    );
  });

  it('throws if the event is not a Kinesis Firehose event', () => {
    // Prepare
    const event = { foo: 'bar' };

    // Act & Assess
    expect(() => KinesisFirehoseSchema.parse(event)).toThrow();
  });

  it('parses a SQS record from a Kinesis Firehose event', () => {
    // Prepare
    const event = structuredClone(sqsEvent);

    // Act
    const parsedEvent = KinesisFirehoseSqsSchema.parse(event);

    // Assess
    expect(parsedEvent.records).toHaveLength(1);
    expect(parsedEvent.records[0].data.body).toEqual('Test message.');
  });

  it.fails(
    'throws if the SQS record within the Kinesis Firehose event is invalid',
    () => {
      // Prepare
      const event = structuredClone(sqsEvent);
      event.records[0].data = 'Invalid SQS record';

      // Act & Assess
      expect(() => KinesisFirehoseSqsSchema.parse(event)).toThrow();
    }
  );
});
