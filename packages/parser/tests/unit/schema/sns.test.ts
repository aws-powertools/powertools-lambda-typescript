import { describe, expect, it } from 'vitest';
import { SnsSchema } from '../../../src/schemas/sns.js';
import type { SnsEvent } from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: SNS', () => {
  const baseEvent = getTestEvent<SnsEvent>({
    eventsPath: 'sns',
    filename: 'base',
  });

  it('parses a SNS event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const parsedEvent = SnsSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
    expect(parsedEvent.Records[0].Sns.Message).toEqual('Hello from SNS!');
  });

  it('throws if event is not a SNS event', () => {
    // Prepare
    const event = { foo: 'bar' };

    // Act & Assess
    expect(() => SnsSchema.parse(event)).toThrow();
  });
});
