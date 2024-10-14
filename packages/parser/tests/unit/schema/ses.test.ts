import { describe, expect, it } from 'vitest';
import { SesSchema } from '../../../src/schemas/ses.js';
import type { SesEvent } from '../../../src/types';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: SES', () => {
  const baseEvent = getTestEvent<SesEvent>({
    eventsPath: 'ses',
    filename: 'base',
  });

  it('parses a SES event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const parsedEvent = SesSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
    expect(parsedEvent.Records[0].ses.mail.source).toEqual(
      'janedoe@example.com'
    );
  });

  it('throws if event is not a SES event', () => {
    // Prepare
    const event = { foo: 'bar' };

    // Act & Assess
    expect(() => SesSchema.parse(event)).toThrow();
  });
});
