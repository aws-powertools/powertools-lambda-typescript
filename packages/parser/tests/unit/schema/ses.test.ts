import { describe, expect, it } from 'vitest';
import { SesSchema } from '../../../src/schemas/ses.js';
import type { SesEvent } from '../../../src/types/index.js';
import { getTestEvent } from './utils.js';

describe('Schema: SES', () => {
  const baseEvent = getTestEvent<SesEvent>({
    eventsPath: 'ses',
    filename: 'base',
  });

  it('parses a SES event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = SesSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the event is not a SES event', () => {
    // Prepare
    const event = {
      Records: [],
    };

    // Act & Assess
    expect(() => SesSchema.parse(event)).toThrow();
  });
});
