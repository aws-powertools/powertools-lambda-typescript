import { describe, expect, it } from 'vitest';
import { DynamoDBStreamSchema } from '../../../src/schemas/dynamodb.js';
import type { DynamoDBStreamEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../schema/utils.js';

describe('Schema: DynamoDB ', () => {
  const baseEvent = getTestEvent<DynamoDBStreamEvent>({
    eventsPath: 'dynamodb',
    filename: 'base',
  });

  it('parses a DynamoDB Stream event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const parsedEvent = DynamoDBStreamSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it('throws if event is not a DynamoDB Stream event', () => {
    // Prepare
    const event = {
      Records: [],
    };

    // Act & Assess
    expect(() => DynamoDBStreamSchema.parse(event)).toThrow();
  });
});
