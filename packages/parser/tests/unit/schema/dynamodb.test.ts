/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

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
