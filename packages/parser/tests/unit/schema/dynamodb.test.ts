/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { DynamoDBStreamSchema } from '../../../src/schemas/';
import { TestEvents, makeSchemaStrictForTesting } from './utils.js';

describe('DynamoDB ', () => {
  const dynamoStreamEvent = TestEvents.dynamoStreamEvent;
  it('should parse a stream of records', () => {
    expect(DynamoDBStreamSchema.parse(dynamoStreamEvent)).toEqual(
      dynamoStreamEvent
    );
  });

  it('should detect missing properties in schema', () => {
    const strictSchema = makeSchemaStrictForTesting(DynamoDBStreamSchema);

    expect(() => strictSchema.parse(dynamoStreamEvent)).not.toThrow();
  });
});
