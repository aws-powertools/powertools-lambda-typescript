/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { DynamoDBStreamSchema } from '../../../src/schemas/dynamodb';
import { loadExampleEvent } from './utils';

describe('DynamoDB ', () => {
  const dynamoStreamEvent = loadExampleEvent('dynamoStreamEvent.json');
  it('should parse a stream of records', () => {
    expect(DynamoDBStreamSchema.parse(dynamoStreamEvent)).toEqual(
      dynamoStreamEvent
    );
  });
});
