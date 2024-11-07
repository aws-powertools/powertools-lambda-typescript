import { describe, expect, it } from 'vitest';
import { DynamoDBStreamSchema } from '../../../src/schemas/';
import { TestEvents } from './utils.js';

describe('DynamoDB ', () => {
  const dynamoStreamEvent = TestEvents.dynamoStreamEvent;
  it('should parse a stream of records', () => {
    expect(DynamoDBStreamSchema.parse(dynamoStreamEvent)).toEqual(
      dynamoStreamEvent
    );
  });
});
