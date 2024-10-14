import { describe, expect, it } from 'vitest';
import { LambdaFunctionUrlSchema } from '../../../src/schemas/lambda.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: Lambda', () => {
  const eventsPath = 'lambda';

  it('parses a Lambda FUrl event', () => {
    // Prepare
    const event = getTestEvent({
      eventsPath,
      filename: 'base',
    });

    // Act
    const parsedEvent = LambdaFunctionUrlSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it('parses a Lambda FUrl with IAM Auth', () => {
    // Prepare
    const event = getTestEvent({
      eventsPath,
      filename: 'iam-authorizer',
    });

    // Act
    const parsedEvent = LambdaFunctionUrlSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it('parses a Lambda FUrl with string body', () => {
    // Prepare
    const event = getTestEvent({
      eventsPath,
      filename: 'with-body',
    });

    // Act
    const parsedEvent = LambdaFunctionUrlSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it('throws if event is not a Lambda FUrl event', () => {
    // Prepare
    const event = { foo: 'bar' };

    // Act & Assess
    expect(() => LambdaFunctionUrlSchema.parse(event)).toThrow();
  });
});
