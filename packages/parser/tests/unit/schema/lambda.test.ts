import { describe, expect, it } from 'vitest';
import { LambdaFunctionUrlSchema } from '../../../src/schemas/';
import { getTestEvent } from './utils.js';

describe('Schema: LambdaFunctionUrl', () => {
  const eventsPath = 'lambda';

  it('throw when the event is invalid', () => {
    // Prepare
    const event = getTestEvent({ eventsPath, filename: 'invalid' });

    // Act & Assess
    expect(() => LambdaFunctionUrlSchema.parse(event)).toThrow();
  });

  it('parses a valid event', () => {
    // Prepare
    const event = getTestEvent({ eventsPath, filename: 'get-request' });

    // Act
    const parsedEvent = LambdaFunctionUrlSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it('parses iam event', () => {
    // Prepare
    const event = getTestEvent({ eventsPath, filename: 'iam-auth' });

    // Act
    const parsedEvent = LambdaFunctionUrlSchema.parse(event);

    //
    expect(parsedEvent).toEqual(event);
  });
});
