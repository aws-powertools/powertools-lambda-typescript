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
    const expectedResult = structuredClone(event);
    expectedResult.Records[0].dynamodb.Keys = {
      Id: 101,
    };
    expectedResult.Records[0].dynamodb.NewImage = {
      Message: 'New item!',
      Id: 101,
    };
    expectedResult.Records[1].dynamodb.Keys = {
      Id: 101,
    };
    expectedResult.Records[1].dynamodb.OldImage = {
      Message: 'New item!',
      Id: 101,
    };
    expectedResult.Records[1].dynamodb.NewImage = {
      Message: 'This item has changed',
      Id: 101,
    };
    expect(parsedEvent).toStrictEqual(expectedResult);
  });

  it('throws if event is not a DynamoDB Stream event', () => {
    // Prepare
    const event = {
      Records: [],
    };

    // Act & Assess
    expect(() => DynamoDBStreamSchema.parse(event)).toThrow();
  });

  it('throws if the Keys DynamoDB AttributeValues cannot be unmarshalled', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.Records[0].dynamodb.Keys = {
      Id: { L: 'invalid' },
    };

    // Act & Assess
    expect(() => DynamoDBStreamSchema.parse(event)).toThrow();
  });

  it('throws if the NewImage DynamoDB AttributeValues cannot be unmarshalled', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.Records[0].dynamodb.NewImage = {
      Message: { S: 'New item!' },
      Id: { L: 'invalid' },
    };

    // Act & Assess
    expect(() => DynamoDBStreamSchema.parse(event)).toThrow();
  });

  it('throws if the OldImage DynamoDB AttributeValues cannot be unmarshalled', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.Records[1].dynamodb.OldImage = {
      Message: { S: 'New item!' },
      Id: { L: 'invalid' },
    };

    // Act & Assess
    expect(() => DynamoDBStreamSchema.parse(event)).toThrow();
  });
});
