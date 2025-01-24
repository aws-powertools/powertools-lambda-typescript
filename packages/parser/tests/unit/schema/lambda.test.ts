import { describe, expect, it } from 'vitest';
import { LambdaFunctionUrlSchema } from '../../../src/schemas/lambda.js';
import type { LambdaFunctionUrlEvent } from '../../../src/types/schema.js';
import { getTestEvent } from './utils.js';

describe('Schema: LambdaFunctionUrl', () => {
  const eventsPath = 'lambda';

  it('throws when the event is invalid', () => {
    // Prepare
    const event = getTestEvent<LambdaFunctionUrlEvent>({
      eventsPath,
      filename: 'invalid',
    });

    // Act & Assess
    expect(() => LambdaFunctionUrlSchema.parse(event)).toThrow();
  });

  it('parses a valid Lambda Function URL event', () => {
    // Prepare
    const event = getTestEvent<LambdaFunctionUrlEvent>({
      eventsPath,
      filename: 'get-request',
    });

    // Act
    const parsedEvent = LambdaFunctionUrlSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it('parses a Lambda Function URL event with iam', () => {
    // Prepare
    const event = getTestEvent<LambdaFunctionUrlEvent>({
      eventsPath,
      filename: 'iam-auth',
    });

    // Act
    const parsedEvent = LambdaFunctionUrlSchema.parse(event);

    //
    expect(parsedEvent).toEqual(event);
  });
});
