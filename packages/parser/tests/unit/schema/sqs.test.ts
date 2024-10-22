import { describe, expect, it } from 'vitest';
import { SqsSchema } from '../../../src/schemas/sqs.js';
import type { SqsEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: SqsSchema ', () => {
  const baseEvent = getTestEvent<SqsEvent>({
    eventsPath: 'sqs',
    filename: 'base',
  });

  it('parses a SQS event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const parsedEvent = SqsSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it('throws if event is not a SQS event', () => {
    // Prepare
    const event = { foo: 'bar' };

    // Act & Assess
    expect(() => SqsSchema.parse(event)).toThrow();
  });
});
