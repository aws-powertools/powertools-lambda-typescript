import { describe, expect, it } from 'vitest';
import { AlbMultiValueHeadersSchema, AlbSchema } from '../../../src/schemas/';
import { getTestEvent } from '../helpers/utils.js';

describe('ALB Schemas', () => {
  const eventsPath = 'alb';

  it('should parse alb event', () => {
    // Prepare
    const event = getTestEvent({ eventsPath, filename: 'base' });

    // Act
    const parsedEvent = AlbSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });
  it('should parse alb event path trailing slash', () => {
    // Prepare
    const event = getTestEvent({
      eventsPath,
      filename: 'trailing-slash-in-path',
    });

    // Act
    const parsedEvent = AlbSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });
  it('should parse alb event with multi value headers event', () => {
    // Prepare
    const event = getTestEvent({ eventsPath, filename: 'multi-value-header' });

    // Act
    const parsedEvent = AlbMultiValueHeadersSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });
});
