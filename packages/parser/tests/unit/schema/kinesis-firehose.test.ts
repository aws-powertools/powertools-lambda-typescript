import { describe, expect, it } from 'vitest';
import { KinesisFirehoseSchema } from '../../../src/schemas/kinesis-firehose.js';
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

  it.each([
    { event: putEvent, name: 'Direct Put' },
    { event: dataStreamEvent, name: 'From Data Stream' },
  ])('parses a Kinesis event ($name)', ({ event }) => {
    // Act
    const parsed = KinesisFirehoseSchema.parse(event);

    // Assess
    expect(parsed.records).toBeInstanceOf(Array);
    expect(parsed.records[0].data).toEqual('Hello World');
    expect(parsed.records[1].data).toEqual(JSON.stringify({ Hello: 'World' }));
  });

  it('throws if event is not a Kinesis Firehose event', () => {
    // Prepare
    const event = { foo: 'bar' };

    // Act & Assess
    expect(() => KinesisFirehoseSchema.parse(event)).toThrow();
  });
});
