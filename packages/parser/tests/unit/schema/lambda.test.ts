import { describe, expect, it } from 'vitest';
import { LambdaFunctionUrlSchema } from '../../../src/schemas/';
import { TestEvents, getTestEvent } from './utils.js';

describe('Schema: LambdaFunctionUrl ', () => {
  const eventsPath = 'lambda';

  it('should throw when the event is invalid', () => {
    const event = getTestEvent({ eventsPath, filename: 'invalid' });

    expect(() => LambdaFunctionUrlSchema.parse(event)).toThrow();
  });

  it('parses a valid event', () => {
    const event = getTestEvent({ eventsPath, filename: 'get-request' });

    const parsedEvent = LambdaFunctionUrlSchema.parse(event);

    expect(parsedEvent).toEqual(event);
  });

  it('parses event with trailing slash', () => {
    const event = getTestEvent({ eventsPath, filename: 'with-trailing-slash' });

    const parsedEvent = LambdaFunctionUrlSchema.parse(event);

    expect(parsedEvent).toEqual(event);
  });

  it('parses iam event', () => {
    const event = getTestEvent({ eventsPath, filename: 'iam-auth' });

    const parsedEvent = LambdaFunctionUrlSchema.parse(event);

    expect(parsedEvent).toEqual(event);
  });
});
