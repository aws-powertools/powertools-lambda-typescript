import { describe, expect, it } from 'vitest';
import { KinesisDataStreamSchema } from '../../../src/schemas/kinesis.js';
import type { KinesisDataStreamEvent } from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: Kinesis', () => {
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
});
