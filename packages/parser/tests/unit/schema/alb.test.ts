import { describe, expect, it } from 'vitest';
import {
  AlbMultiValueHeadersSchema,
  AlbSchema,
} from '../../../src/schemas/alb.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: ALB', () => {
  const eventsPath = 'alb';

  it('parses an ALB event', () => {
    // Prepare
    const event = getTestEvent({ eventsPath, filename: 'base' });

    // Act
    const parsedEvent = AlbSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it('parses an ALB event with multi value headers', () => {
    // Prepare
    const event = getTestEvent({ eventsPath, filename: 'multi-value-header' });

    // Act
    const parsedEvent = AlbMultiValueHeadersSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it('throws if event is not a ALB event', () => {
    // Prepare
    const event = { foo: 'bar' };

    // Act & Assess
    expect(() => AlbSchema.parse(event)).toThrow();
  });
});
