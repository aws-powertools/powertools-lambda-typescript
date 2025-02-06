import { describe, expect, it } from 'vitest';
import { SqsSchema } from '../../../src/schemas/sqs.js';
import type { SqsEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: SQS', () => {
  const baseEvent = getTestEvent<SqsEvent>({
    eventsPath: 'sqs',
    filename: 'base',
  });

  it('parses an SQS event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = SqsSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the event is not an SQS event', () => {
    // Prepare
    const event = {
      Records: [],
    };

    // Act & Assess
    expect(() => SqsSchema.parse(event)).toThrow();
  });
});
